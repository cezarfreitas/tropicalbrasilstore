import { Router } from "express";
import db from "../lib/db";
import * as XLSX from "xlsx";

const router = Router();

// Get filtered orders with pagination and search
router.get("/filtered", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      status = "",
      date = "",
      sortBy = "created_at",
      sortOrder = "desc"
    } = req.query;

    let whereClause = "WHERE 1=1";
    const params: any[] = [];

    // Search filter
    if (search) {
      whereClause += ` AND (o.id LIKE ? OR o.customer_email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    // Status filter
    if (status) {
      whereClause += ` AND o.status = ?`;
      params.push(status);
    }

    // Date filter
    if (date) {
      switch (date) {
        case "today":
          whereClause += ` AND DATE(o.created_at) = CURDATE()`;
          break;
        case "week":
          whereClause += ` AND o.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`;
          break;
        case "month":
          whereClause += ` AND o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`;
          break;
        case "year":
          whereClause += ` AND o.created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)`;
          break;
      }
    }

    // Calculate offset
    const offset = (Number(page) - 1) * Number(limit);

    // Valid sort columns
    const validSortColumns = ["id", "customer_email", "total_amount", "status", "created_at"];
    const sortColumn = validSortColumns.includes(String(sortBy)) ? sortBy : "created_at";
    const sortDirection = sortOrder === "asc" ? "ASC" : "DESC";

    const [orders] = await db.execute(`
      SELECT
        o.id,
        o.customer_email,
        o.total_amount,
        o.status,
        o.created_at,
        o.updated_at,
        '' as customer_name,
        '' as customer_whatsapp,
        COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      ${whereClause}
      GROUP BY o.id
      ORDER BY o.${sortColumn} ${sortDirection}
      LIMIT ? OFFSET ?
    `, [...params, Number(limit), offset]);

    res.json(orders);
  } catch (error) {
    console.error("Error fetching filtered orders:", error);
    res.status(500).json({ error: "Failed to fetch filtered orders" });
  }
});

// Get all orders with customer and item details
router.get("/", async (req, res) => {
  try {
    const [orders] = await db.execute(`
      SELECT 
        o.id,
        o.customer_email,
                        o.total_amount,
        o.status,
        o.created_at,
        o.updated_at,
                        '' as customer_name,
        '' as customer_whatsapp,
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
                        '' as customer_whatsapp,
                o.total_amount
      FROM orders o
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
        p.sku as product_sku,
                CONCAT(p.sku, '-', COALESCE(co.name, ''), '-', COALESCE(s.size, '')) as sku_variant,
        s.size,
        co.name as color_name,
        co.hex_code as color_hex,
        g.name as grade_name,
        g.description as grade_description
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
            LEFT JOIN colors co ON oi.color_id = co.id
      LEFT JOIN sizes s ON oi.size_id = s.id
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

// Add item to order
router.post("/:id/items", async (req, res) => {
  try {
    const { product_id, size_id, color_id, grade_id, quantity, unit_price, type } = req.body;
    const orderId = req.params.id;

    const total_price = quantity * unit_price;

    const [result] = await db.execute(`
      INSERT INTO order_items (order_id, product_id, size_id, color_id, grade_id, quantity, unit_price, total_price, type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [orderId, product_id, size_id || null, color_id || null, grade_id || null, quantity, unit_price, total_price, type || 'product']);

    // Update order total
    await updateOrderTotal(orderId);

    res.json({ message: "Item added to order successfully", id: (result as any).insertId });
  } catch (error) {
    console.error("Error adding item to order:", error);
    res.status(500).json({ error: "Failed to add item to order" });
  }
});

// Remove item from order
router.delete("/:orderId/items/:itemId", async (req, res) => {
  try {
    const { orderId, itemId } = req.params;

    const [result] = await db.execute(`
      DELETE FROM order_items WHERE id = ? AND order_id = ?
    `, [itemId, orderId]);

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    // Update order total
    await updateOrderTotal(orderId);

    res.json({ message: "Item removed from order successfully" });
  } catch (error) {
    console.error("Error removing item from order:", error);
    res.status(500).json({ error: "Failed to remove item from order" });
  }
});

// Update order item
router.patch("/:orderId/items/:itemId", async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const { quantity, unit_price } = req.body;

    const total_price = quantity * unit_price;

    const [result] = await db.execute(`
      UPDATE order_items
      SET quantity = ?, unit_price = ?, total_price = ?
      WHERE id = ? AND order_id = ?
    `, [quantity, unit_price, total_price, itemId, orderId]);

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    // Update order total
    await updateOrderTotal(orderId);

    res.json({ message: "Item updated successfully" });
  } catch (error) {
    console.error("Error updating order item:", error);
    res.status(500).json({ error: "Failed to update order item" });
  }
});

// Helper function to update order total
async function updateOrderTotal(orderId: string) {
  const [items] = await db.execute(`
    SELECT SUM(total_price) as total_amount
    FROM order_items
    WHERE order_id = ?
  `, [orderId]);

  const totalAmount = (items as any[])[0]?.total_amount || 0;

  await db.execute(`
    UPDATE orders
    SET total_amount = ?, updated_at = NOW()
    WHERE id = ?
  `, [totalAmount, orderId]);
}

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

// Export orders to Excel
router.get("/export/excel", async (req, res) => {
  try {
    // Get all orders with detailed item information
    const [orderData] = await db.execute(`
      SELECT
        o.id as pedido_id,
        o.customer_email as cliente_email,
        o.status as status_pedido,
        o.total_amount as valor_total,
        o.created_at as data_pedido,
        oi.id as item_id,
        p.name as produto_nome,
        p.sku as produto_sku,
        p.parent_sku as produto_parent_sku,
        CONCAT(p.sku, '-', COALESCE(co.name, ''), '-', COALESCE(s.size, '')) as sku_variante,
        co.name as cor_nome,
        co.hex_code as cor_hex,
        s.size as tamanho,
        g.name as grade_nome,
        g.description as grade_descricao,
        oi.quantity as quantidade,
        oi.unit_price as preco_unitario,
        oi.total_price as preco_total,
        oi.type as tipo_item
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN colors co ON oi.color_id = co.id
      LEFT JOIN sizes s ON oi.size_id = s.id
      LEFT JOIN grade_vendida g ON oi.grade_id = g.id
      ORDER BY o.created_at DESC, oi.id
    `);

    // Format data for Excel
    const excelData = (orderData as any[]).map((row) => ({
      "ID Pedido": row.pedido_id,
      "Data Pedido": new Date(row.data_pedido).toLocaleDateString("pt-BR"),
      "Cliente Email": row.cliente_email,
      Status: row.status_pedido,
      "Valor Total Pedido": `R$ ${parseFloat(row.valor_total || 0).toFixed(2)}`,
      Produto: row.produto_nome || "",
      "SKU Produto": row.produto_sku || "",
      "SKU Pai": row.produto_parent_sku || "",
      "SKU Variante": row.sku_variante || "",
      Cor: row.cor_nome || "",
      "Cor Hex": row.cor_hex || "",
      Tamanho: row.tamanho || "",
      Grade: row.grade_nome || "",
      "Descrição Grade": row.grade_descricao || "",
      Quantidade: row.quantidade || 0,
      "Preço Unitário": `R$ ${parseFloat(row.preco_unitario || 0).toFixed(2)}`,
      "Preço Total Item": `R$ ${parseFloat(row.preco_total || 0).toFixed(2)}`,
      "Tipo Item": row.tipo_item || "",
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Auto-size columns
    const colWidths = [
      { wch: 10 }, // ID Pedido
      { wch: 12 }, // Data Pedido
      { wch: 25 }, // Cliente Email
      { wch: 12 }, // Status
      { wch: 15 }, // Valor Total Pedido
      { wch: 25 }, // Produto
      { wch: 15 }, // SKU Produto
      { wch: 15 }, // SKU Pai
      { wch: 20 }, // SKU Variante
      { wch: 15 }, // Cor
      { wch: 10 }, // Cor Hex
      { wch: 10 }, // Tamanho
      { wch: 15 }, // Grade
      { wch: 25 }, // Descrição Grade
      { wch: 10 }, // Quantidade
      { wch: 12 }, // Preço Unitário
      { wch: 12 }, // Pre��o Total Item
      { wch: 12 }, // Tipo Item
    ];
    ws["!cols"] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Pedidos");

    // Generate Excel buffer
    const excelBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    // Set response headers for file download
    const filename = `pedidos_${new Date().toISOString().split("T")[0]}.xlsx`;
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", excelBuffer.length);

    // Send the Excel file
    res.send(excelBuffer);
  } catch (error) {
    console.error("Error exporting orders to Excel:", error);
    res.status(500).json({ error: "Failed to export orders to Excel" });
  }
});

// Export single order to Excel
router.get("/:id/export/excel", async (req, res) => {
  try {
    const orderId = req.params.id;

    // Get single order with detailed item information
    const [orderData] = await db.execute(`
      SELECT
        o.id as pedido_id,
        o.customer_email as cliente_email,
        o.status as status_pedido,
        o.total_amount as valor_total,
        o.created_at as data_pedido,
        oi.id as item_id,
        p.name as produto_nome,
        p.sku as produto_sku,
        p.parent_sku as produto_parent_sku,
        CONCAT(p.sku, '-', COALESCE(co.name, ''), '-', COALESCE(s.size, '')) as sku_variante,
        co.name as cor_nome,
        co.hex_code as cor_hex,
        s.size as tamanho,
        g.name as grade_nome,
        g.description as grade_descricao,
        oi.quantity as quantidade,
        oi.unit_price as preco_unitario,
        oi.total_price as preco_total,
        oi.type as tipo_item
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN colors co ON oi.color_id = co.id
      LEFT JOIN sizes s ON oi.size_id = s.id
      LEFT JOIN grade_vendida g ON oi.grade_id = g.id
      WHERE o.id = ?
      ORDER BY oi.id
    `, [orderId]);

    if ((orderData as any[]).length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Format data for Excel
    const excelData = (orderData as any[]).map(row => ({
      'ID Pedido': row.pedido_id,
      'Data Pedido': new Date(row.data_pedido).toLocaleDateString('pt-BR'),
      'Cliente Email': row.cliente_email,
      'Status': row.status_pedido,
      'Valor Total Pedido': `R$ ${parseFloat(row.valor_total || 0).toFixed(2)}`,
      'Produto': row.produto_nome || '',
      'SKU Produto': row.produto_sku || '',
      'SKU Pai': row.produto_parent_sku || '',
      'SKU Variante': row.sku_variante || '',
      'Cor': row.cor_nome || '',
      'Cor Hex': row.cor_hex || '',
      'Tamanho': row.tamanho || '',
      'Grade': row.grade_nome || '',
      'Descrição Grade': row.grade_descricao || '',
      'Quantidade': row.quantidade || 0,
      'Preço Unitário': `R$ ${parseFloat(row.preco_unitario || 0).toFixed(2)}`,
      'Preço Total Item': `R$ ${parseFloat(row.preco_total || 0).toFixed(2)}`,
      'Tipo Item': row.tipo_item || ''
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Auto-size columns
    const colWidths = [
      { wch: 10 }, // ID Pedido
      { wch: 12 }, // Data Pedido
      { wch: 25 }, // Cliente Email
      { wch: 12 }, // Status
      { wch: 15 }, // Valor Total Pedido
      { wch: 25 }, // Produto
      { wch: 15 }, // SKU Produto
      { wch: 15 }, // SKU Pai
      { wch: 20 }, // SKU Variante
      { wch: 15 }, // Cor
      { wch: 10 }, // Cor Hex
      { wch: 10 }, // Tamanho
      { wch: 15 }, // Grade
      { wch: 25 }, // Descrição Grade
      { wch: 10 }, // Quantidade
      { wch: 12 }, // Preço Unitário
      { wch: 12 }, // Preço Total Item
      { wch: 12 }, // Tipo Item
    ];
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, `Pedido ${orderId}`);

    // Generate Excel buffer
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Set response headers for file download
    const filename = `pedido_${orderId}_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', excelBuffer.length);

    // Send the Excel file
    res.send(excelBuffer);
  } catch (error) {
    console.error("Error exporting single order to Excel:", error);
    res.status(500).json({ error: "Failed to export order to Excel" });
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
