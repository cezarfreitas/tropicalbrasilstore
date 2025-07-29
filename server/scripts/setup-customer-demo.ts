import db from "../lib/db";
import bcrypt from "bcryptjs";

async function setupCustomerDemo() {
  try {
    console.log("🔄 Configurando cliente demo para teste...");

    // 1. Verificar se o cliente Maria Silva existe em customer_auth
    const [existingAuth] = await db.execute(
      `SELECT * FROM customer_auth WHERE email = ?`,
      ["maria.silva@email.com"]
    );

    if ((existingAuth as any[]).length === 0) {
      console.log("👤 Criando autenticação para Maria Silva...");
      
      // Criar hash da senha
      const password = "demo123";
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Inserir na tabela customer_auth
      await db.execute(
        `INSERT INTO customer_auth (name, email, whatsapp, password, status) VALUES (?, ?, ?, ?, ?)`,
        ["Maria Silva Santos", "maria.silva@email.com", "11999991111", hashedPassword, "approved"]
      );
      
      console.log("✅ Cliente demo criado:");
      console.log("   📧 Email: maria.silva@email.com");
      console.log("   📱 WhatsApp: 11999991111");
      console.log("   🔑 Senha: demo123");
    } else {
      console.log("👤 Cliente demo já existe");
      
      // Atualizar senha para garantir que funcione
      const password = "demo123";
      const hashedPassword = await bcrypt.hash(password, 10);
      
      await db.execute(
        `UPDATE customer_auth SET password = ?, status = 'approved', whatsapp = ? WHERE email = ?`,
        [hashedPassword, "11999991111", "maria.silva@email.com"]
      );
      
      console.log("✅ Senha do cliente demo atualizada:");
      console.log("   📧 Email: maria.silva@email.com");
      console.log("   📱 WhatsApp: 11999991111");
      console.log("   🔑 Senha: demo123");
    }

    // 2. Verificar os pedidos associados
    const [orders] = await db.execute(
      `SELECT COUNT(*) as total FROM orders WHERE customer_email = ?`,
      ["maria.silva@email.com"]
    );
    
    console.log(`📦 Total de pedidos: ${(orders as any[])[0].total}`);

    // 3. Testar login
    console.log("\n🔑 Testando login...");
    
    const testResponse = await fetch('http://localhost:8080/api/customers/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        whatsapp: '11999991111',
        password: 'demo123'
      })
    });
    
    if (testResponse.ok) {
      const customerData = await testResponse.json();
      console.log("✅ Login funcionando:", customerData);
      
      // 4. Testar API de pedidos
      console.log("\n📦 Testando API de pedidos...");
      
      const ordersResponse = await fetch(`http://localhost:8080/api/customer-orders/${customerData.id}`);
      
      if (ordersResponse.ok) {
        const customerOrders = await ordersResponse.json();
        console.log(`✅ API de pedidos funcionando: ${customerOrders.length} pedidos encontrados`);
        
        customerOrders.forEach((order: any, index: number) => {
          console.log(`  📋 Pedido ${index + 1}: ${order.id} - ${order.status} - R$ ${order.total}`);
        });
      } else {
        const error = await ordersResponse.json();
        console.log("❌ Erro na API de pedidos:", error);
      }
      
    } else {
      const error = await testResponse.json();
      console.log("❌ Erro no login:", error);
    }

  } catch (error) {
    console.error("❌ Erro ao configurar cliente demo:", error);
  }
}

// Executar
setupCustomerDemo().then(() => {
  console.log("🏁 Configuração finalizada");
  process.exit(0);
}).catch((error) => {
  console.error("💥 Erro fatal:", error);
  process.exit(1);
});
