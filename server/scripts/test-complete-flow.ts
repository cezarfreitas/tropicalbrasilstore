async function testCompleteFlow() {
  try {
    console.log("🔄 Testando fluxo completo de pedidos do cliente...");

    // 1. Verificar se temos clientes na tabela customer_auth
    console.log("\n👥 Verificando autenticação de clientes...");

    const response1 = await fetch("http://localhost:8080/api/customers/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        whatsapp: "5511999991111", // WhatsApp da Maria Silva
        password: "temp123", // Senha padrão temporária
      }),
    });

    if (response1.ok) {
      const customerData = await response1.json();
      console.log(`✅ Login realizado:`, customerData);

      // 2. Buscar pedidos deste cliente autenticado
      console.log(`\n📦 Buscando pedidos do cliente ID: ${customerData.id}`);

      const response2 = await fetch(
        `http://localhost:8080/api/customer-orders/${customerData.id}`,
      );
      const orders = await response2.json();

      if (response2.ok) {
        console.log(`✅ Encontrados ${orders.length} pedidos para o cliente`);

        orders.forEach((order: any, index: number) => {
          console.log(`\n📋 Pedido ${index + 1}:`);
          console.log(`  🆔 ID: ${order.id}`);
          console.log(
            `  📅 Data: ${new Date(order.date).toLocaleDateString("pt-BR")}`,
          );
          console.log(`  📊 Status: ${order.status}`);
          console.log(`  💰 Total: R$ ${order.total.toFixed(2)}`);
          console.log(`  📦 Itens: ${order.items.length}`);

          order.items.forEach((item: any, itemIndex: number) => {
            console.log(`    🛒 Item ${itemIndex + 1}: ${item.productName}`);
            console.log(`      - Quantidade: ${item.quantity}`);
            console.log(
              `      - Preço unitário: R$ ${item.unitPrice.toFixed(2)}`,
            );
            if (item.colorName) console.log(`      - Cor: ${item.colorName}`);
            if (item.gradeName)
              console.log(`      - Grade/Tamanho: ${item.gradeName}`);
          });
        });

        console.log("\n🎉 Fluxo completo testado com sucesso!");

        // 3. Testar interface - simular requisição do frontend
        console.log("\n🌐 Simulando requisição do frontend...");

        const frontendResponse = await fetch(
          `http://localhost:8080/api/customer-orders/${customerData.id}`,
          {
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
          },
        );

        if (frontendResponse.ok) {
          const frontendOrders = await frontendResponse.json();
          console.log(
            `✅ Frontend pode acessar ${frontendOrders.length} pedidos`,
          );
        } else {
          console.log(
            `❌ Erro na requisição do frontend: ${frontendResponse.status}`,
          );
        }
      } else {
        console.log(`❌ Erro ao buscar pedidos: ${orders.error}`);
      }
    } else {
      console.log("❌ Falha no login. Verificando dados disponíveis...");

      // Listar clientes disponíveis
      const customerResponse = await fetch(
        "http://localhost:8080/api/admin/customers",
      );
      if (customerResponse.ok) {
        const customers = await customerResponse.json();
        console.log("👥 Clientes disponíveis:", customers.slice(0, 3));
      }
    }
  } catch (error) {
    console.error("❌ Erro no teste:", error);
  }
}

// Executar teste
testCompleteFlow()
  .then(() => {
    console.log("🏁 Teste completo finalizado");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Erro fatal:", error);
    process.exit(1);
  });
