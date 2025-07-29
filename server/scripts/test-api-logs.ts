async function testApiLogs() {
  try {
    console.log("🔄 Testando sistema de logs da API...");

    // 1. Fazer algumas requisições que serão logadas
    console.log("\n📝 Fazendo requisições de teste...");
    
    // Requisição para admin/orders (sucesso)
    const response1 = await fetch('http://localhost:8080/api/admin/orders');
    console.log(`GET /admin/orders: ${response1.status}`);

    // Requisição para admin/customers (sucesso)
    const response2 = await fetch('http://localhost:8080/api/admin/customers');
    console.log(`GET /admin/customers: ${response2.status}`);

    // Requisição para endpoint inexistente (404)
    const response3 = await fetch('http://localhost:8080/api/admin/nonexistent');
    console.log(`GET /admin/nonexistent: ${response3.status}`);

    // Aguardar um pouco para os logs serem salvos
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 2. Verificar se os logs foram salvos
    console.log("\n📊 Verificando logs salvos...");
    
    const logsResponse = await fetch('http://localhost:8080/api/admin/logs');
    if (logsResponse.ok) {
      const logsData = await logsResponse.json();
      console.log(`✅ Logs encontrados: ${logsData.logs.length}`);
      
      logsData.logs.slice(0, 3).forEach((log: any, index: number) => {
        console.log(`  ${index + 1}. ${log.method} ${log.endpoint} - Status: ${log.response_status} - Tempo: ${log.response_time_ms}ms`);
      });
    } else {
      console.log("❌ Erro ao buscar logs");
    }

    // 3. Verificar estatísticas
    console.log("\n📈 Verificando estatísticas...");
    
    const statsResponse = await fetch('http://localhost:8080/api/admin/logs/stats');
    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      console.log("✅ Estatísticas:");
      console.log(`  Total de requisições: ${statsData.overview.total_requests}`);
      console.log(`  Requisições de sucesso: ${statsData.overview.success_requests}`);
      console.log(`  Requisições com erro: ${statsData.overview.error_requests}`);
      console.log(`  Tempo médio: ${Math.round(statsData.overview.avg_response_time)}ms`);
      
      console.log("\n📋 Top endpoints:");
      statsData.top_endpoints.slice(0, 3).forEach((endpoint: any, index: number) => {
        console.log(`  ${index + 1}. ${endpoint.method} ${endpoint.endpoint} - ${endpoint.request_count} requisições`);
      });
    } else {
      console.log("❌ Erro ao buscar estatísticas");
    }

    console.log("\n🎉 Teste do sistema de logs concluído com sucesso!");
    console.log("💡 Acesse /admin/api e vá na aba 'Logs de API' para ver a interface completa");

  } catch (error) {
    console.error("❌ Erro no teste:", error);
  }
}

// Executar teste
testApiLogs().then(() => {
  console.log("🏁 Teste finalizado");
  process.exit(0);
}).catch((error) => {
  console.error("💥 Erro fatal:", error);
  process.exit(1);
});
