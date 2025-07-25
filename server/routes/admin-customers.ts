import { Router } from "express";
import db from "../lib/db";

const router = Router();

// Get all customers with order statistics
router.get("/", async (req, res) => {
  try {
    const [customers] = await db.execute(`
      SELECT 
        c.*,
        COUNT(o.id) as total_orders,
                SUM(o.total_amount) as total_spent,
        MAX(o.created_at) as last_order_date,
        COUNT(CASE WHEN o.status = 'delivered' THEN 1 END) as completed_orders
            FROM customers c
      LEFT JOIN orders o ON c.email COLLATE utf8mb4_unicode_ci = o.customer_email COLLATE utf8mb4_unicode_ci
      GROUP BY c.email
      ORDER BY c.created_at DESC
    `);

    res.json(customers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});

// Get specific customer details with order history
router.get("/:email", async (req, res) => {
  try {
    // Get customer basic info
    const [customerRows] = await db.execute(
      `
      SELECT 
        c.*,
        COUNT(o.id) as total_orders,
                SUM(o.total_amount) as total_spent,
        MAX(o.created_at) as last_order_date,
        COUNT(CASE WHEN o.status = 'delivered' THEN 1 END) as completed_orders
            FROM customers c
      LEFT JOIN orders o ON c.email COLLATE utf8mb4_unicode_ci = o.customer_email COLLATE utf8mb4_unicode_ci
      WHERE c.email = ?
      GROUP BY c.email
    `,
      [decodeURIComponent(req.params.email)],
    );

    if (customerRows.length === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    const customer = (customerRows as any)[0];

    // Get customer's order history
    const [orderRows] = await db.execute(
      `
      SELECT 
        o.id,
                o.total_amount,
        o.status,
        o.created_at,
        COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.customer_email = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `,
      [decodeURIComponent(req.params.email)],
    );

    customer.orders = orderRows;

    res.json(customer);
  } catch (error) {
    console.error("Error fetching customer details:", error);
    res.status(500).json({ error: "Failed to fetch customer details" });
  }
});

// Create new customer
router.post("/", async (req, res) => {
  try {
    const { email, name, whatsapp, minimum_order } = req.body;

    if (!email || !name) {
      return res.status(400).json({ error: "Email e nome são obrigatórios" });
    }

    // Check if customer already exists
    const [existingCustomer] = await db.execute(
      "SELECT email FROM customers WHERE email = ?",
      [email],
    );

    if ((existingCustomer as any[]).length > 0) {
      return res
        .status(409)
        .json({ error: "Cliente já existe com este email" });
    }

    // Insert new customer
    await db.execute(
      `
      INSERT INTO customers (email, name, whatsapp, minimum_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, NOW(), NOW())
    `,
      [email, name, whatsapp || null, minimum_order || 0],
    );

    res.status(201).json({ message: "Cliente criado com sucesso" });
  } catch (error) {
    console.error("Error creating customer:", error);
    res.status(500).json({ error: "Falha ao criar cliente" });
  }
});

// Update customer information
router.patch("/:email", async (req, res) => {
  try {
    const { name, whatsapp, minimum_order } = req.body;

    if (!name && !whatsapp && minimum_order === undefined) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const updateFields = [];
    const updateValues = [];

    if (name) {
      updateFields.push("name = ?");
      updateValues.push(name);
    }

    if (whatsapp) {
      updateFields.push("whatsapp = ?");
      updateValues.push(whatsapp);
    }

    if (minimum_order !== undefined) {
      updateFields.push("minimum_order = ?");
      updateValues.push(minimum_order);
    }

    updateFields.push("updated_at = NOW()");
    updateValues.push(decodeURIComponent(req.params.email));

    await db.execute(
      `
      UPDATE customers 
      SET ${updateFields.join(", ")}
      WHERE email = ?
    `,
      updateValues,
    );

    res.json({ message: "Customer updated successfully" });
  } catch (error) {
    console.error("Error updating customer:", error);
    res.status(500).json({ error: "Failed to update customer" });
  }
});

// Get customer statistics for dashboard
router.get("/stats/summary", async (req, res) => {
  try {
    const [stats] = await db.execute(`
      SELECT 
        COUNT(*) as total_customers,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as new_customers_week,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_customers_month,
        (
          SELECT COUNT(DISTINCT customer_email) 
          FROM orders 
          WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        ) as active_customers_month
      FROM customers
    `);

    res.json((stats as any)[0]);
  } catch (error) {
    console.error("Error fetching customer statistics:", error);
    res.status(500).json({ error: "Failed to fetch customer statistics" });
  }
});

export { router as adminCustomersRouter };
