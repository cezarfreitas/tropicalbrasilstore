import db from "../lib/db";

async function debugCustomerOrders() {
  try {
    console.log("🔍 Debugando problema dos pedidos...");

    // 1. Verificar dados dos clientes
    console.log("\n👥 Clientes:");
    const [customers] = await db.execute("SELECT * FROM customers LIMIT 3");
    console.table(customers);

    // 2. Verificar pedidos
    console.log("\n📦 Pedidos:");
    const [orders] = await db.execute("SELECT * FROM orders LIMIT 5");
    console.table(orders);

    // 3. Verificar itens dos pedidos
    console.log("\n🛒 Itens dos pedidos:");
    const [items] = await db.execute(`
      SELECT oi.*, p.name as product_name, p.photo 
      FROM order_items oi 
      JOIN products p ON oi.product_id = p.id 
      LIMIT 5
    `);
    console.table(items);

    // 4. Testar query específica para cliente ID 1
    console.log("\n🎯 Teste da query para cliente ID 1:");

    const [customerRow] = await db.execute(
      `SELECT email FROM customers WHERE id = ?`,
      [1],
    );

    if ((customerRow as any[]).length === 0) {
      console.log("❌ Cliente ID 1 não encontrado");
      return;
    }

    const customerEmail = (customerRow as any[])[0].email;
    console.log(`📧 Email do cliente: ${customerEmail}`);

    const [orderRows] = await db.execute(
      `
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
    `,
      [customerEmail],
    );

    console.log(`📋 Pedidos encontrados: ${(orderRows as any[]).length}`);
    console.table(orderRows);

    // 5. Para cada pedido, buscar itens detalhados
    for (const order of orderRows as any[]) {
      console.log(`\n🔍 Itens do pedido ${order.id}:`);

      const [itemRows] = await db.execute(
        `
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
      `,
        [order.id],
      );

      console.table(itemRows);
    }
  } catch (error) {
    console.error("❌ Erro no debug:", error);
  }
}

// Executar debug
debugCustomerOrders()
  .then(() => {
    console.log("🏁 Debug finalizado");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Erro fatal:", error);
    process.exit(1);
  });
