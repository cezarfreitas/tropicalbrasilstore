import db from "../lib/db";

async function debugCezarOrders() {
  try {
    console.log("🔍 Debugando pedidos do Cezar (11) 98988-2867...");

    // 1. Buscar dados do cliente Cezar
    console.log("\n👤 Dados do cliente Cezar:");
    const [cezarCustomers] = await db.execute(
      `SELECT * FROM customers WHERE whatsapp LIKE '%98988-2867%' OR name LIKE '%Cezar%'`,
    );
    console.table(cezarCustomers);

    // 2. Buscar dados na customer_auth
    console.log("\n🔐 Dados na customer_auth:");
    const [cezarAuth] = await db.execute(
      `SELECT * FROM customer_auth WHERE whatsapp LIKE '%98988-2867%' OR name LIKE '%Cezar%'`,
    );
    console.table(cezarAuth);

    // 3. Buscar pedidos por email do Cezar
    if ((cezarCustomers as any[]).length > 0) {
      const cezarEmail = (cezarCustomers as any[])[0].email;
      console.log(`\n📦 Pedidos do email: ${cezarEmail}`);

      const [cezarOrders] = await db.execute(
        `SELECT * FROM orders WHERE customer_email = ?`,
        [cezarEmail],
      );
      console.table(cezarOrders);

      // 4. Buscar por outros emails potenciais
      const [allCezarEmails] = await db.execute(
        `SELECT DISTINCT email FROM customers WHERE name LIKE '%Cezar%'`,
      );

      for (const customer of allCezarEmails as any[]) {
        console.log(`\n📧 Verificando pedidos para: ${customer.email}`);
        const [orders] = await db.execute(
          `SELECT COUNT(*) as total FROM orders WHERE customer_email = ?`,
          [customer.email],
        );
        console.log(`   Total: ${(orders as any[])[0].total} pedidos`);
      }
    }

    // 5. Buscar todos os pedidos existentes para debug
    console.log("\n📋 Todos os emails com pedidos:");
    const [allOrdersCustomers] = await db.execute(
      `SELECT customer_email, COUNT(*) as total_orders FROM orders GROUP BY customer_email ORDER BY total_orders DESC`,
    );
    console.table(allOrdersCustomers);

    // 6. Testar API diretamente
    console.log("\n🧪 Testando API para o cliente Cezar...");
    if ((cezarAuth as any[]).length > 0) {
      const cezarId = (cezarAuth as any[])[0].id;
      console.log(`Cliente ID: ${cezarId}`);

      const response = await fetch(
        `http://localhost:8080/api/customer-orders/${cezarId}`,
      );
      const orders = await response.json();

      if (response.ok) {
        console.log(`✅ API funcionou: ${orders.length} pedidos encontrados`);
        console.table(orders);
      } else {
        console.log(`❌ Erro na API:`, orders);
      }
    }
  } catch (error) {
    console.error("❌ Erro no debug:", error);
  }
}

// Executar
debugCezarOrders()
  .then(() => {
    console.log("🏁 Debug finalizado");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Erro fatal:", error);
    process.exit(1);
  });
