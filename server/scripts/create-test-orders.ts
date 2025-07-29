import db from "../lib/db";

async function createTestOrders() {
  try {
    console.log("🔄 Criando pedidos de teste...");

    // 1. Verificar se existe cliente
    const [existingCustomers] = await db.execute(
      `SELECT id, email, name FROM customers LIMIT 1`
    );

    let customerId: number;
    let customerEmail: string;

    if ((existingCustomers as any[]).length === 0) {
      // Criar cliente de teste
      console.log("👤 Criando cliente de teste...");
      const [customerResult] = await db.execute(
        `INSERT INTO customers (name, email, whatsapp) VALUES (?, ?, ?)`,
        ["João Silva", "joao@teste.com", "11999999999"]
      );
      customerId = (customerResult as any).insertId;
      customerEmail = "joao@teste.com";
      console.log(`✅ Cliente criado: ID ${customerId}, Email: ${customerEmail}`);
    } else {
      customerId = (existingCustomers as any[])[0].id;
      customerEmail = (existingCustomers as any[])[0].email;
      console.log(`✅ Usando cliente existente: ID ${customerId}, Email: ${customerEmail}`);
    }

    // 2. Verificar se existem produtos
    const [existingProducts] = await db.execute(
      `SELECT id, name, sku FROM products LIMIT 5`
    );

    if ((existingProducts as any[]).length === 0) {
      console.log("❌ Nenhum produto encontrado. Execute o seed primeiro.");
      return;
    }

    console.log(`📦 Encontrados ${(existingProducts as any[]).length} produtos`);

    // 3. Criar pedidos de teste
    const orders = [
      {
        status: "delivered",
        total: 159.90,
        notes: "Entrega realizada com sucesso",
        items: [
          {
            product_id: (existingProducts as any[])[0].id,
            quantity: 2,
            unit_price: 79.95,
            type: "individual"
          }
        ]
      },
      {
        status: "shipped",
        total: 299.80,
        notes: "Produto em trânsito",
        items: [
          {
            product_id: (existingProducts as any[])[1] ? (existingProducts as any[])[1].id : (existingProducts as any[])[0].id,
            quantity: 1,
            unit_price: 299.80,
            type: "individual"
          }
        ]
      },
      {
        status: "pending",
        total: 89.90,
        notes: "Aguardando confirmação do pagamento",
        items: [
          {
            product_id: (existingProducts as any[])[2] ? (existingProducts as any[])[2].id : (existingProducts as any[])[0].id,
            quantity: 1,
            unit_price: 89.90,
            type: "individual"
          }
        ]
      }
    ];

    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      
      // Criar pedido
      const [orderResult] = await db.execute(
        `INSERT INTO orders (customer_email, total_amount, status, notes, created_at) VALUES (?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL ? DAY))`,
        [customerEmail, order.total, order.status, order.notes, i * 5] // Espaçar pedidos por 5 dias
      );
      
      const orderId = (orderResult as any).insertId;
      console.log(`📝 Pedido criado: ID ${orderId}, Status: ${order.status}, Total: R$ ${order.total}`);

      // Criar itens do pedido
      for (const item of order.items) {
        await db.execute(
          `INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price, type) VALUES (?, ?, ?, ?, ?, ?)`,
          [orderId, item.product_id, item.quantity, item.unit_price, item.quantity * item.unit_price, item.type]
        );
        console.log(`  ✅ Item adicionado: Produto ${item.product_id}, Qtd: ${item.quantity}, Preço: R$ ${item.unit_price}`);
      }
    }

    console.log("🎉 Pedidos de teste criados com sucesso!");
    
    // 4. Verificar resultado
    const [verifyOrders] = await db.execute(
      `SELECT COUNT(*) as total FROM orders WHERE customer_email = ?`,
      [customerEmail]
    );
    
    const [verifyItems] = await db.execute(
      `SELECT COUNT(*) as total FROM order_items oi 
       JOIN orders o ON oi.order_id = o.id 
       WHERE o.customer_email = ?`,
      [customerEmail]
    );

    console.log(`📊 Resultado: ${(verifyOrders as any[])[0].total} pedidos, ${(verifyItems as any[])[0].total} itens criados`);
    console.log(`👤 Cliente: ${customerEmail} (ID: ${customerId})`);

  } catch (error) {
    console.error("❌ Erro ao criar pedidos de teste:", error);
  }
}

// Executar diretamente
createTestOrders().then(() => {
  console.log("🏁 Script finalizado");
  process.exit(0);
}).catch((error) => {
  console.error("💥 Erro fatal:", error);
  process.exit(1);
});

export { createTestOrders };
