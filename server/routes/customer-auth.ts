import { Router } from "express";
import bcrypt from "bcryptjs";
import db from "../lib/db";

const router = Router();

// Customer registration
router.post("/register", async (req, res) => {
  try {
    const { name, email, whatsapp, vendor_ref } = req.body;

    if (!name || !email || !whatsapp) {
      return res
        .status(400)
        .json({ error: "Nome, email e WhatsApp são obrigatórios" });
    }

    // Remove formatting from WhatsApp (keep only digits)
    const cleanWhatsapp = whatsapp.replace(/\D/g, "");

    if (cleanWhatsapp.length !== 11) {
      return res.status(400).json({ error: "WhatsApp deve ter 11 dígitos" });
    }

    // Check if customer already exists with this email or whatsapp
    const [existingCustomer] = await db.execute(
      "SELECT id FROM customer_auth WHERE email = ? OR whatsapp = ?",
      [email, cleanWhatsapp],
    );

    if ((existingCustomer as any[]).length > 0) {
      return res.status(409).json({
        error: "Já existe um cadastro com este email ou WhatsApp",
      });
    }

    let vendorId = null;
    let status = "pending";
    let message = "Cadastro realizado! Aguarde aprovação do administrador.";

    // Check if vendor reference is provided
    if (vendor_ref) {
      const [vendor] = await db.execute(
        "SELECT id, name FROM vendors WHERE id = ? AND active = 1",
        [vendor_ref],
      );

      if ((vendor as any[]).length > 0) {
        vendorId = vendor_ref;
        status = "approved"; // Auto-approve customers from vendor links
        message = `Cadastro realizado e aprovado automaticamente! Você foi atribuído ao vendedor ${(vendor as any[])[0].name}.`;
      }
    }

    // Insert new customer
    const [result] = await db.execute(
      `INSERT INTO customer_auth (name, email, whatsapp, status, is_first_login, created_at, updated_at)
       VALUES (?, ?, ?, ?, TRUE, NOW(), NOW())`,
      [name, email, cleanWhatsapp, status],
    );

    const customerId = (result as any).insertId;

    // If vendor reference is valid, also create entry in customers table for vendor assignment
    if (vendorId && status === "approved") {
      await db.execute(
        `INSERT INTO customers (name, email, whatsapp, vendor_id, vendor_assigned_at, vendor_assigned_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, NOW(), 'auto_referral', NOW(), NOW())
         ON DUPLICATE KEY UPDATE
         vendor_id = VALUES(vendor_id),
         vendor_assigned_at = VALUES(vendor_assigned_at),
         vendor_assigned_by = VALUES(vendor_assigned_by),
         updated_at = NOW()`,
        [name, email, cleanWhatsapp, vendorId],
      );
    }

    res.status(201).json({
      message,
      customerId,
      vendor_assigned: !!vendorId,
      auto_approved: status === "approved",
    });
  } catch (error) {
    console.error("Error in customer registration:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Customer login
router.post("/login", async (req, res) => {
  try {
    const { whatsapp, password } = req.body;

    if (!whatsapp || !password) {
      return res
        .status(400)
        .json({ error: "WhatsApp e senha são obrigatórios" });
    }

    // Remove formatting from WhatsApp
    const cleanWhatsapp = whatsapp.replace(/\D/g, "");

    if (cleanWhatsapp.length !== 11) {
      return res.status(400).json({ error: "WhatsApp deve ter 11 dígitos" });
    }

    // Find customer by WhatsApp and get minimum_order from customers table
    const [customerRows] = await db.execute(
      `
      SELECT
        ca.*,
        c.minimum_order
      FROM customer_auth ca
      LEFT JOIN customers c ON ca.email = c.email
      WHERE ca.whatsapp = ?
    `,
      [cleanWhatsapp],
    );

    if ((customerRows as any[]).length === 0) {
      return res.status(401).json({ error: "WhatsApp não encontrado" });
    }

    const customer = (customerRows as any)[0];

    // Check if customer is approved
    if (customer.status !== "approved") {
      let message = "Sua conta ainda não foi aprovada";
      if (customer.status === "rejected") {
        message = "Sua conta foi rejeitada. Entre em contato com o suporte.";
      }
      return res.status(403).json({ error: message });
    }

    // Check password
    const defaultPassword = cleanWhatsapp.slice(-4); // Last 4 digits
    let isValidPassword = false;

    if (customer.password) {
      // If custom password is set, check against it
      isValidPassword = await bcrypt.compare(password, customer.password);
    } else {
      // If no custom password, check against default (last 4 digits)
      isValidPassword = password === defaultPassword;
    }

    if (!isValidPassword) {
      return res.status(401).json({ error: "Senha incorreta" });
    }

    // Return customer data (excluding password)
    const { password: _, ...customerData } = customer;
    res.json({
      ...customerData,
      whatsapp: `(${cleanWhatsapp.slice(0, 2)}) ${cleanWhatsapp.slice(2, 7)}-${cleanWhatsapp.slice(7)}`,
    });
  } catch (error) {
    console.error("Error in customer login:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Change password
router.post("/change-password", async (req, res) => {
  try {
    const { newPassword, whatsapp } = req.body;

    if (!whatsapp) {
      return res.status(400).json({ error: "WhatsApp é obrigatório" });
    }

    if (!newPassword || newPassword.length < 4) {
      return res
        .status(400)
        .json({ error: "Nova senha deve ter pelo menos 4 caracteres" });
    }

    // Remove formatting from WhatsApp
    const cleanWhatsapp = whatsapp.replace(/\D/g, "");

    // Find customer by WhatsApp
    const [customerRows] = await db.execute(
      "SELECT id, status FROM customer_auth WHERE whatsapp = ?",
      [cleanWhatsapp],
    );

    if ((customerRows as any[]).length === 0) {
      return res.status(404).json({ error: "Cliente não encontrado" });
    }

    const customer = (customerRows as any)[0];

    if (customer.status !== "approved") {
      return res.status(403).json({ error: "Cliente não está aprovado" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update customer password and mark first login as false
    await db.execute(
      `UPDATE customer_auth 
       SET password = ?, is_first_login = FALSE, updated_at = NOW()
       WHERE id = ?`,
      [hashedPassword, customer.id],
    );

    res.json({ message: "Senha alterada com sucesso!" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Get pending customers (for admin approval)
router.get("/pending", async (req, res) => {
  try {
    const [customers] = await db.execute(`
      SELECT id, name, email, whatsapp, status, created_at
      FROM customer_auth 
      WHERE status = 'pending'
      ORDER BY created_at ASC
    `);

    // Format whatsapp for display
    const formattedCustomers = (customers as any[]).map((customer) => ({
      ...customer,
      whatsapp: `(${customer.whatsapp.slice(0, 2)}) ${customer.whatsapp.slice(2, 7)}-${customer.whatsapp.slice(7)}`,
    }));

    res.json(formattedCustomers);
  } catch (error) {
    console.error("Error fetching pending customers:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Update customer status (approve/reject)
router.put("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res
        .status(400)
        .json({ error: "Status deve ser 'approved' ou 'rejected'" });
    }

    // Update customer status
    const [result] = await db.execute(
      `UPDATE customer_auth 
       SET status = ?, updated_at = NOW()
       WHERE id = ?`,
      [status, id],
    );

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ error: "Cliente não encontrado" });
    }

    res.json({
      message: `Cliente ${status === "approved" ? "aprovado" : "rejeitado"} com sucesso`,
    });
  } catch (error) {
    console.error("Error updating customer status:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export { router as customerAuthRouter };
