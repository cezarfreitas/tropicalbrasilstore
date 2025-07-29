async function testAdminApiLogsOnly() {
  try {
    console.log("🔄 Testando se apenas /admin/api são logadas...");

    // Contar logs atuais
    const initialResponse = await fetch(
      "http://localhost:8080/api/admin/logs/stats",
    );
    const initialStats = await initialResponse.json();
    const initialCount = initialStats.overview.total_requests;
    console.log(`📊 Logs iniciais: ${initialCount}`);

    // 1. Fazer requisições que NÃO devem ser logadas (outras rotas /admin)
    console.log("\n🚫 Testando rotas que NÃO devem ser logadas:");

    // Rota /admin/orders (não deve logar)
    const adminOrdersResponse = await fetch(
      "http://localhost:8080/api/admin/orders",
    );
    console.log(
      `GET /admin/orders: ${adminOrdersResponse.status} (não deve ser logado)`,
    );

    // Rota /admin/customers (não deve logar)
    const adminCustomersResponse = await fetch(
      "http://localhost:8080/api/admin/customers",
    );
    console.log(
      `GET /admin/customers: ${adminCustomersResponse.status} (não deve ser logado)`,
    );

    // 2. Fazer requisições que DEVEM ser logadas (rotas /admin/api)
    console.log("\n✅ Testando rotas que DEVEM ser logadas:");

    // Rota /admin/api - esta deve ser logada
    const adminApiResponse = await fetch("http://localhost:8080/api/admin/api");
    console.log(`GET /admin/api: ${adminApiResponse.status} (deve ser logado)`);

    // Aguardar um pouco para os logs serem processados
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 3. Verificar se apenas as rotas corretas foram logadas
    console.log("\n📊 Verificando novos logs...");

    const finalResponse = await fetch(
      "http://localhost:8080/api/admin/logs/stats",
    );
    const finalStats = await finalResponse.json();
    const finalCount = finalStats.overview.total_requests;

    const newLogs = finalCount - initialCount;
    console.log(`📝 Novos logs adicionados: ${newLogs}`);

    if (newLogs === 1) {
      console.log(
        "✅ CORRETO: Apenas 1 nova requisição foi logada (/admin/api)",
      );
    } else if (newLogs === 0) {
      console.log("⚠️ Nenhum log novo (pode ser que /admin/api não exista)");
    } else {
      console.log(
        `❌ ERRO: ${newLogs} requisições foram logadas (deveria ser apenas 1)`,
      );
    }

    // 4. Mostrar últimos logs para confirmar
    console.log("\n📋 Últimos logs registrados:");
    const logsResponse = await fetch(
      "http://localhost:8080/api/admin/logs?limit=3",
    );
    if (logsResponse.ok) {
      const logsData = await logsResponse.json();
      logsData.logs.forEach((log: any, index: number) => {
        console.log(
          `  ${index + 1}. ${log.method} ${log.endpoint} - ${new Date(log.created_at).toLocaleTimeString()}`,
        );
      });
    }

    console.log("\n🎯 RESULTADO:");
    console.log(
      "- ✅ Rotas /admin/orders e /admin/customers NÃO devem aparecer nos logs",
    );
    console.log("- ✅ Apenas rotas /admin/api devem ser registradas");
  } catch (error) {
    console.error("❌ Erro no teste:", error);
  }
}

// Executar teste
testAdminApiLogsOnly()
  .then(() => {
    console.log("🏁 Teste finalizado");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Erro fatal:", error);
    process.exit(1);
  });
