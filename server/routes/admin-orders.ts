import { Router } from "express";
import db from "../lib/db";
import * as XLSX from 'xlsx';

const router = Router();

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
        p.photo as product_photo,
        p.sku as product_sku,
        COALESCE(pv.sku_variant, CONCAT(p.sku, '-', co.name, '-', s.size)) as sku_variant,
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
      LEFT JOIN product_variants pv ON (p.id = pv.product_id AND oi.color_id = pv.color_id AND oi.size_id = pv.size_id)
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
    const excelData = (orderData as any[]).map(row => ({
      'ID Pedido': row.pedido_id,
      'Data Pedido': new Date(row.data_pedido).toLocaleDateString('pt-BR'),
      'Cliente Email': row.cliente_email,
      'Status': row.status_pedido,
      'Valor Total Pedido': `R$ ${(row.valor_total || 0).toFixed(2)}`,
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
      'Preço Unitário': `R$ ${(row.preco_unitario || 0).toFixed(2)}`,
      'Preço Total Item': `R$ ${(row.preco_total || 0).toFixed(2)}`,
      'Estoque Variante': row.estoque_variante || 0,
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
      { wch: 12 }, // Estoque Variante
      { wch: 12 }, // Tipo Item
    ];
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Pedidos');

    // Generate Excel buffer
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Set response headers for file download
    const filename = `pedidos_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', excelBuffer.length);

    // Send the Excel file
    res.send(excelBuffer);
  } catch (error) {
    console.error("Error exporting orders to Excel:", error);
    res.status(500).json({ error: "Failed to export orders to Excel" });
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
                SUM(total_price) as total_revenue,
        AVG(total_price) as average_order_value,
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
