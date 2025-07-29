// Using native Node.js fetch (available in Node 18+)

async function testCustomerOrdersAPI() {
  try {
    console.log("🔄 Testando API de pedidos do cliente...");

    // Teste 1: Buscar pedidos por ID do cliente
    console.log("\n📋 Teste 1: Buscar pedidos por ID do cliente (ID: 1)");
    const response1 = await fetch('http://localhost:8080/api/customer-orders/1');
    const orders1 = await response1.json();

    if (response1.ok) {
      console.log(`✅ Sucesso! Encontrados ${orders1.length} pedidos`);
      orders1.forEach((order: any, index: number) => {
        console.log(`  📦 Pedido ${index + 1}: ${order.id} - Status: ${order.status} - Total: R$ ${order.total} - Itens: ${order.items.length}`);
      });
    } else {
      console.log(`❌ Erro: ${orders1.error}`);
    }

    // Teste 2: Buscar pedidos por email
    console.log("\n📋 Teste 2: Buscar pedidos por email");
    const response2 = await fetch('http://localhost:8080/api/customer-orders/by-email/maria.silva@email.com');
    const orders2 = await response2.json();

    if (response2.ok) {
      console.log(`✅ Sucesso! Encontrados ${orders2.length} pedidos`);
      orders2.forEach((order: any, index: number) => {
        console.log(`  📦 Pedido ${index + 1}: ${order.id} - Status: ${order.status} - Total: R$ ${order.total}`);
        order.items.forEach((item: any, itemIndex: number) => {
          console.log(`    🛒 Item ${itemIndex + 1}: ${item.productName} - Qtd: ${item.quantity} - Preço: R$ ${item.unitPrice}`);
        });
      });
    } else {
      console.log(`❌ Erro: ${orders2.error}`);
    }

    // Teste 3: Cliente inexistente
    console.log("\n📋 Teste 3: Cliente inexistente (ID: 9999)");
    const response3 = await fetch('http://localhost:8080/api/customer-orders/9999');
    const orders3 = await response3.json();
    
    if (!response3.ok) {
      console.log(`✅ Erro esperado: ${orders3.error}`);
    } else {
      console.log(`❌ Deveria ter retornado erro, mas retornou: ${JSON.stringify(orders3)}`);
    }

    console.log("\n🎉 Teste da API concluído!");

  } catch (error) {
    console.error("❌ Erro no teste:", error);
  }
}

// Executar teste
testCustomerOrdersAPI().then(() => {
  console.log("🏁 Teste finalizado");
  process.exit(0);
}).catch((error) => {
  console.error("💥 Erro fatal:", error);
  process.exit(1);
});
