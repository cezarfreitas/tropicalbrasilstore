async function debugLogsApiError() {
  try {
    console.log("🔍 Debugando erro na API de logs...");

    // Fazer requisição e capturar erro detalhado
    const response = await fetch('http://localhost:8080/api/admin/logs?page=1&limit=5', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    console.log(`Status: ${response.status}`);
    console.log(`Status Text: ${response.statusText}`);
    
    const responseText = await response.text();
    console.log(`Response Body:`, responseText);

    if (!response.ok) {
      console.log("❌ Erro detectado na API");
      
      // Testar query diretamente no banco
      console.log("\n🧪 Testando query diretamente...");
      
      try {
        const testQuery = `
          SELECT 
            id,
            method,
            endpoint,
            user_agent,
            ip_address,
            response_status,
            response_time_ms,
            error_message,
            created_at
          FROM api_logs 
          ORDER BY created_at DESC 
          LIMIT 5 OFFSET 0
        `;
        
        console.log("Query a ser executada:", testQuery);
        
      } catch (dbError) {
        console.log("❌ Erro na query:", dbError);
      }
    } else {
      console.log("✅ API funcionando corretamente");
      try {
        const data = JSON.parse(responseText);
        console.log("Dados retornados:", data);
      } catch (parseError) {
        console.log("❌ Erro ao parsear JSON:", parseError);
      }
    }

  } catch (error) {
    console.error("❌ Erro na requisição:", error);
  }
}

debugLogsApiError().then(() => {
  console.log("🏁 Debug finalizado");
  process.exit(0);
}).catch((error) => {
  console.error("💥 Erro fatal:", error);
  process.exit(1);
});
