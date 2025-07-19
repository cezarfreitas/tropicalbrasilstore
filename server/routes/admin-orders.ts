import { Router } from "express";
import db from "../lib/db";

const router = Router();

// Get all orders with customer and item details
router.get("/", async (req, res) => {
  try {
    const [orders] = await db.execute(`
      SELECT 
        o.id,
        o.customer_email,
                o.total_price as total_amount,
        o.status,
        o.created_at,
        o.updated_at,
                o.customer_name,
        o.customer_phone as customer_whatsapp,
        COUNT(oi.id) as item_count
            FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `);

    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// Get specific order details with items
router.get("/:id", async (req, res) => {
  try {
    // Get order basic info
    const [orderRows] = await db.execute(
      `
      SELECT 
        o.*,
        c.name as customer_name,
        c.whatsapp as customer_whatsapp
      FROM orders o
      LEFT JOIN customers c ON o.customer_email = c.email
      WHERE o.id = ?
    `,
      [req.params.id],
    );

    if (orderRows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = (orderRows as any)[0];

    // Get order items
    const [itemRows] = await db.execute(
      `
      SELECT 
        oi.*,
        p.name as product_name,
        p.photo as product_photo,
        co.name as color_name,
        co.hex_code as color_hex,
        g.name as grade_name,
        g.description as grade_description
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN colors co ON oi.color_id = co.id
      LEFT JOIN grade_vendida g ON oi.grade_id = g.id
      WHERE oi.order_id = ?
      ORDER BY oi.id
    `,
      [req.params.id],
    );

    order.items = itemRows;

    res.json(order);
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).json({ error: "Failed to fetch order details" });
  }
});

// Update order status
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    if (
      ![
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ].includes(status)
    ) {
      return res.status(400).json({ error: "Invalid status" });
    }

    await db.execute(
      `
      UPDATE orders 
      SET status = ?, updated_at = NOW()
      WHERE id = ?
    `,
      [status, req.params.id],
    );

    res.json({ message: "Order status updated successfully" });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ error: "Failed to update order status" });
  }
});

// Get order statistics for dashboard
router.get("/stats/summary", async (req, res) => {
  try {
    const [stats] = await db.execute(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_orders,
        COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_orders,
        COUNT(CASE WHEN status = 'shipped' THEN 1 END) as shipped_orders,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as average_order_value,
        COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as today_orders,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as week_orders,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as month_orders
      FROM orders
    `);

    res.json((stats as any)[0]);
  } catch (error) {
    console.error("Error fetching order statistics:", error);
    res.status(500).json({ error: "Failed to fetch order statistics" });
  }
});

export { router as adminOrdersRouter };
