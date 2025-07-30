import { Router } from "express";
import db from "../lib/db";
import bcrypt from "bcryptjs";
import { generateToken } from "../lib/auth-utils";

const router = Router();

interface Vendor {
  id?: number;
  name: string;
  email: string;
  phone?: string;

  active: boolean;
  avatar_url?: string;
  bio?: string;
  notification_email: boolean;
  notification_whatsapp: boolean;
}

// Listar todos os vendedores
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string || "";
    const status = req.query.status as string || "all";

    const offset = (page - 1) * limit;

    let whereClause = "WHERE 1=1";
    const params: any[] = [];

    if (search) {
      whereClause += " AND (v.name LIKE ? OR v.email LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    if (status !== "all") {
      whereClause += " AND v.active = ?";
      params.push(status === "active" ? 1 : 0);
    }

    // Contar total
    const [countResult] = await db.execute(
      `SELECT COUNT(*) as total FROM vendors v ${whereClause}`,
      params
    );
    const total = (countResult as any[])[0].total;

    // Buscar vendedores com estatísticas
    const [vendors] = await db.execute(`
      SELECT 
        v.*,
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_sales,
        COALESCE(SUM(vc.commission_amount), 0) as total_commissions,
        COUNT(DISTINCT CASE WHEN vc.status = 'pending' THEN vc.id END) as pending_commissions
      FROM vendors v
      LEFT JOIN orders o ON v.id = o.vendor_id
      LEFT JOIN vendor_commissions vc ON v.id = vc.vendor_id
      ${whereClause}
      GROUP BY v.id, v.name, v.email, v.phone, v.commission_percentage, v.active, 
               v.created_at, v.updated_at, v.avatar_url, v.bio, v.notification_email, 
               v.notification_whatsapp, v.last_login
      ORDER BY v.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `, params);

    res.json({
      vendors,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching vendors:", error);
    res.status(500).json({ error: "Failed to fetch vendors" });
  }
});

// Obter vendedor específico
router.get("/:id", async (req, res) => {
  try {
    const [vendors] = await db.execute(`
      SELECT 
        v.*,
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_sales,
        COALESCE(SUM(vc.commission_amount), 0) as total_commissions,
        COUNT(DISTINCT CASE WHEN vc.status = 'pending' THEN vc.id END) as pending_commissions
      FROM vendors v
      LEFT JOIN orders o ON v.id = o.vendor_id
      LEFT JOIN vendor_commissions vc ON v.id = vc.vendor_id
      WHERE v.id = ?
      GROUP BY v.id
    `, [req.params.id]);

    if ((vendors as any[]).length === 0) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    res.json((vendors as any[])[0]);
  } catch (error) {
    console.error("Error fetching vendor:", error);
    res.status(500).json({ error: "Failed to fetch vendor" });
  }
});

// Criar novo vendedor
router.post("/", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      commission_percentage,
      active = true,
      avatar_url,
      bio,
      notification_email = true,
      notification_whatsapp = true,
      password
    } = req.body;

    // Validações
    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    if (commission_percentage < 0 || commission_percentage > 100) {
      return res.status(400).json({ error: "Commission percentage must be between 0 and 100" });
    }

    // Verificar se email já existe
    const [existingVendor] = await db.execute(
      "SELECT id FROM vendors WHERE email = ?",
      [email]
    );

    if ((existingVendor as any[]).length > 0) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // Hash da senha se fornecida
    let passwordHash = null;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    const [result] = await db.execute(`
      INSERT INTO vendors (
        name, email, phone, commission_percentage, active,
        avatar_url, bio, notification_email, notification_whatsapp, password_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name, email, phone, commission_percentage, active,
      avatar_url, bio, notification_email, notification_whatsapp, passwordHash
    ]);

    const vendorId = (result as any).insertId;

    res.status(201).json({
      id: vendorId,
      name,
      email,
      phone,
      commission_percentage,
      active,
      message: "Vendor created successfully"
    });

  } catch (error) {
    console.error("Error creating vendor:", error);
    res.status(500).json({ error: "Failed to create vendor" });
  }
});

// Atualizar vendedor
router.put("/:id", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      commission_percentage,
      active,
      avatar_url,
      bio,
      notification_email,
      notification_whatsapp,
      password
    } = req.body;

    // Verificar se vendedor existe
    const [existingVendor] = await db.execute(
      "SELECT id FROM vendors WHERE id = ?",
      [req.params.id]
    );

    if ((existingVendor as any[]).length === 0) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    // Verificar se email já existe em outro vendedor
    if (email) {
      const [emailCheck] = await db.execute(
        "SELECT id FROM vendors WHERE email = ? AND id != ?",
        [email, req.params.id]
      );

      if ((emailCheck as any[]).length > 0) {
        return res.status(400).json({ error: "Email already exists" });
      }
    }

    // Preparar campos para atualização
    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      updates.push("name = ?");
      values.push(name);
    }
    if (email !== undefined) {
      updates.push("email = ?");
      values.push(email);
    }
    if (phone !== undefined) {
      updates.push("phone = ?");
      values.push(phone);
    }
    if (commission_percentage !== undefined) {
      updates.push("commission_percentage = ?");
      values.push(commission_percentage);
    }
    if (active !== undefined) {
      updates.push("active = ?");
      values.push(active);
    }
    if (avatar_url !== undefined) {
      updates.push("avatar_url = ?");
      values.push(avatar_url);
    }
    if (bio !== undefined) {
      updates.push("bio = ?");
      values.push(bio);
    }
    if (notification_email !== undefined) {
      updates.push("notification_email = ?");
      values.push(notification_email);
    }
    if (notification_whatsapp !== undefined) {
      updates.push("notification_whatsapp = ?");
      values.push(notification_whatsapp);
    }

    // Hash da nova senha se fornecida
    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      updates.push("password_hash = ?");
      values.push(passwordHash);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    values.push(req.params.id);

    await db.execute(
      `UPDATE vendors SET ${updates.join(", ")} WHERE id = ?`,
      values
    );

    res.json({ message: "Vendor updated successfully" });

  } catch (error) {
    console.error("Error updating vendor:", error);
    res.status(500).json({ error: "Failed to update vendor" });
  }
});

// Deletar vendedor
router.delete("/:id", async (req, res) => {
  try {
    // Verificar se vendedor existe
    const [existingVendor] = await db.execute(
      "SELECT id FROM vendors WHERE id = ?",
      [req.params.id]
    );

    if ((existingVendor as any[]).length === 0) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    // Verificar se vendedor tem pedidos atribuídos
    const [orders] = await db.execute(
      "SELECT COUNT(*) as count FROM orders WHERE vendor_id = ?",
      [req.params.id]
    );

    if ((orders as any[])[0].count > 0) {
      return res.status(400).json({ 
        error: "Cannot delete vendor with assigned orders. Disable the vendor instead." 
      });
    }

    await db.execute("DELETE FROM vendors WHERE id = ?", [req.params.id]);

    res.json({ message: "Vendor deleted successfully" });

  } catch (error) {
    console.error("Error deleting vendor:", error);
    res.status(500).json({ error: "Failed to delete vendor" });
  }
});

// Obter clientes de um vendedor
router.get("/:id/customers", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string || "";

    const offset = (page - 1) * limit;

    let whereClause = "WHERE c.vendor_id = ?";
    const params: any[] = [req.params.id];

    if (search) {
      whereClause += " AND (c.name LIKE ? OR c.email LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    // Contar total
    const [countResult] = await db.execute(
      `SELECT COUNT(*) as total FROM customers c ${whereClause}`,
      params
    );
    const total = (countResult as any[])[0].total;

    // Buscar clientes com estatísticas
    const [customers] = await db.execute(`
      SELECT
        c.*,
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_spent,
        MAX(o.created_at) as last_order_date
      FROM customers c
      LEFT JOIN orders o ON c.email = o.customer_email
      ${whereClause}
      GROUP BY c.id
      ORDER BY c.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `, params);

    res.json({
      customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching vendor customers:", error);
    res.status(500).json({ error: "Failed to fetch vendor customers" });
  }
});

// Atribuir cliente a vendedor
router.post("/:vendorId/customers/:customerId", async (req, res) => {
  try {
    const { vendorId, customerId } = req.params;
    const { assigned_by } = req.body;

    // Verificar se vendedor existe
    const [vendor] = await db.execute(
      "SELECT id, name FROM vendors WHERE id = ? AND active = 1",
      [vendorId]
    );

    if ((vendor as any[]).length === 0) {
      return res.status(404).json({ error: "Vendor not found or inactive" });
    }

    // Verificar se cliente existe
    const [customer] = await db.execute(
      "SELECT id, name FROM customers WHERE id = ?",
      [customerId]
    );

    if ((customer as any[]).length === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    // Atribuir cliente ao vendedor
    await db.execute(`
      UPDATE customers
      SET vendor_id = ?,
          vendor_assigned_at = NOW(),
          vendor_assigned_by = ?
      WHERE id = ?
    `, [vendorId, assigned_by || 'System', customerId]);

    res.json({
      message: "Customer assigned to vendor successfully",
      vendor: (vendor as any[])[0],
      customer: (customer as any[])[0]
    });

  } catch (error) {
    console.error("Error assigning customer to vendor:", error);
    res.status(500).json({ error: "Failed to assign customer to vendor" });
  }
});

// Remover cliente de vendedor
router.delete("/:vendorId/customers/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;

    // Verificar se cliente existe e está atribuído ao vendedor
    const [customer] = await db.execute(
      "SELECT id, name, vendor_id FROM customers WHERE id = ?",
      [customerId]
    );

    if ((customer as any[]).length === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    // Remover atribuição do vendedor
    await db.execute(`
      UPDATE customers
      SET vendor_id = NULL,
          vendor_assigned_at = NULL,
          vendor_assigned_by = NULL
      WHERE id = ?
    `, [customerId]);

    res.json({
      message: "Customer removed from vendor successfully",
      customer: (customer as any[])[0]
    });

  } catch (error) {
    console.error("Error removing customer from vendor:", error);
    res.status(500).json({ error: "Failed to remove customer from vendor" });
  }
});

// Listar clientes sem vendedor atribuído
router.get("/unassigned/customers", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string || "";

    const offset = (page - 1) * limit;

    let whereClause = "WHERE c.vendor_id IS NULL";
    const params: any[] = [];

    if (search) {
      whereClause += " AND (c.name LIKE ? OR c.email LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    // Contar total
    const [countResult] = await db.execute(
      `SELECT COUNT(*) as total FROM customers c ${whereClause}`,
      params
    );
    const total = (countResult as any[])[0].total;

    // Buscar clientes sem vendedor
    const [customers] = await db.execute(`
      SELECT
        c.*,
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_spent,
        MAX(o.created_at) as last_order_date
      FROM customers c
      LEFT JOIN orders o ON c.email = o.customer_email
      ${whereClause}
      GROUP BY c.id
      ORDER BY c.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `, params);

    res.json({
      customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching unassigned customers:", error);
    res.status(500).json({ error: "Failed to fetch unassigned customers" });
  }
});

// Estatísticas de vendedores
router.get("/stats/overview", async (req, res) => {
  try {
    const [stats] = await db.execute(`
      SELECT
        COUNT(*) as total_vendors,
        COUNT(CASE WHEN active = 1 THEN 1 END) as active_vendors,
        COUNT(CASE WHEN active = 0 THEN 1 END) as inactive_vendors,
        AVG(commission_percentage) as avg_commission
      FROM vendors
    `);

    const [salesStats] = await db.execute(`
      SELECT
        COUNT(DISTINCT o.id) as total_orders_with_vendors,
        COALESCE(SUM(o.total_amount), 0) as total_sales_with_vendors,
        COALESCE(SUM(vc.commission_amount), 0) as total_commissions,
        COUNT(CASE WHEN vc.status = 'pending' THEN 1 END) as pending_commissions,
        COUNT(CASE WHEN vc.status = 'paid' THEN 1 END) as paid_commissions
      FROM orders o
      LEFT JOIN vendor_commissions vc ON o.id = vc.order_id
      WHERE o.vendor_id IS NOT NULL
    `);

    const [customerStats] = await db.execute(`
      SELECT
        COUNT(*) as total_customers,
        COUNT(CASE WHEN vendor_id IS NOT NULL THEN 1 END) as assigned_customers,
        COUNT(CASE WHEN vendor_id IS NULL THEN 1 END) as unassigned_customers
      FROM customers
    `);

    res.json({
      vendors: (stats as any[])[0],
      sales: (salesStats as any[])[0],
      customers: (customerStats as any[])[0],
    });

  } catch (error) {
    console.error("Error fetching vendor stats:", error);
    res.status(500).json({ error: "Failed to fetch vendor statistics" });
  }
});

export { router as vendorsRouter };
