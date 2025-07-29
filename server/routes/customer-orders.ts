import { Router } from "express";
import db from "../lib/db";

const router = Router();

// Get orders for a specific customer by ID
router.get("/:customerId", async (req, res) => {
  try {
    console.log(`🔍 API: Buscando pedidos para cliente ID: ${req.params.customerId}`);
    const { customerId } = req.params;

    // Get customer details first
    const [customerRows] = await db.execute(
      `SELECT email FROM customers WHERE id = ?`,
      [customerId]
    );

    console.log(`👤 API: Clientes encontrados: ${(customerRows as any[]).length}`);

    if ((customerRows as any[]).length === 0) {
      console.log("❌ API: Cliente não encontrado");
      return res.status(404).json({ error: "Cliente não encontrado" });
    }

    const customerEmail = (customerRows as any[])[0].email;
    console.log(`📧 API: Email do cliente: ${customerEmail}`);
    
    // Get orders for the customer
    const [orderRows] = await db.execute(`
      SELECT 
        o.id,
        o.total_amount,
        o.status,
        o.notes,
        o.created_at as date,
        COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.customer_email = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `, [customerEmail]);
    
    const orders = [];
    
    // For each order, get the detailed items
    for (const order of orderRows as any[]) {
      const [itemRows] = await db.execute(`
        SELECT 
          oi.id,
          oi.quantity,
          oi.unit_price,
          oi.total_price,
          oi.type,
          p.name as product_name,
          p.sku as product_sku,
          p.photo,
          c.name as color_name,
          c.hex_code as color_hex,
          s.name as size_name,
          g.name as grade_name
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        LEFT JOIN colors c ON oi.color_id = c.id
        LEFT JOIN sizes s ON oi.size_id = s.id
        LEFT JOIN grade_vendida g ON oi.grade_id = g.id
        WHERE oi.order_id = ?
        ORDER BY oi.id
      `, [order.id]);
      
      const items = (itemRows as any[]).map((item: any) => ({
        id: item.id.toString(),
        productName: item.product_name,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unit_price),
        photo: item.photo,
        colorName: item.color_name,
        gradeName: item.grade_name || item.size_name,
        type: item.type
      }));
      
      orders.push({
        id: `PED-${order.id.toString().padStart(3, '0')}`,
        date: order.date,
        status: order.status,
        total: parseFloat(order.total_amount),
        items: items
      });
    }
    
    res.json(orders);
  } catch (error) {
    console.error("Error fetching customer orders:", error);
    res.status(500).json({ error: "Erro ao buscar pedidos do cliente" });
  }
});

// Get orders for a customer by email (alternative endpoint)
router.get("/by-email/:email", async (req, res) => {
  try {
    const { email } = req.params;
    
    // Get orders for the customer
    const [orderRows] = await db.execute(`
      SELECT 
        o.id,
        o.total_amount,
        o.status,
        o.notes,
        o.created_at as date,
        COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.customer_email = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `, [email]);
    
    const orders = [];
    
    // For each order, get the detailed items
    for (const order of orderRows as any[]) {
      const [itemRows] = await db.execute(`
        SELECT 
          oi.id,
          oi.quantity,
          oi.unit_price,
          oi.total_price,
          oi.type,
          p.name as product_name,
          p.sku as product_sku,
          p.photo,
          c.name as color_name,
          c.hex_code as color_hex,
          s.name as size_name,
          g.name as grade_name
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        LEFT JOIN colors c ON oi.color_id = c.id
        LEFT JOIN sizes s ON oi.size_id = s.id
        LEFT JOIN grade_vendida g ON oi.grade_id = g.id
        WHERE oi.order_id = ?
        ORDER BY oi.id
      `, [order.id]);
      
      const items = (itemRows as any[]).map((item: any) => ({
        id: item.id.toString(),
        productName: item.product_name,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unit_price),
        photo: item.photo,
        colorName: item.color_name,
        gradeName: item.grade_name || item.size_name,
        type: item.type
      }));
      
      orders.push({
        id: `PED-${order.id.toString().padStart(3, '0')}`,
        date: order.date,
        status: order.status,
        total: parseFloat(order.total_amount),
        items: items
      });
    }
    
    res.json(orders);
  } catch (error) {
    console.error("Error fetching customer orders by email:", error);
    res.status(500).json({ error: "Erro ao buscar pedidos do cliente" });
  }
});

export { router as customerOrdersRouter };
