async function testStoreApiDetailed() {
  try {
    console.log("🔍 Testando API da loja detalhadamente...");

    // Testar diferentes endpoints
    const endpoints = [
      '/api/store/products',
      '/api/store-old/products',
      '/api/store/products?limit=10',
    ];

    for (const endpoint of endpoints) {
      console.log(`\n📡 Testando: ${endpoint}`);
      
      try {
        const response = await fetch(`http://localhost:8080${endpoint}`);
        console.log(`Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          const text = await response.text();
          
          try {
            const data = JSON.parse(text);
            
            if (Array.isArray(data)) {
              console.log(`✅ Retornou array com ${data.length} produtos`);
              
              if (data.length > 0) {
                const firstProduct = data[0];
                console.log("📦 Primeiro produto:");
                console.log({
                  id: firstProduct.id,
                  name: firstProduct.name,
                  sell_without_stock: firstProduct.sell_without_stock,
                  total_stock: firstProduct.total_stock,
                  active: firstProduct.active
                });
              }
            } else if (data && typeof data === 'object') {
              console.log(`✅ Retornou objeto:`, Object.keys(data));
              
              if (data.products && Array.isArray(data.products)) {
                console.log(`   Products array: ${data.products.length} items`);
              }
            } else {
              console.log(`⚠️ Formato inesperado:`, typeof data);
            }
          } catch (parseError) {
            console.log(`❌ Erro ao parsear JSON: ${parseError}`);
            console.log(`Response text: ${text.substring(0, 200)}...`);
          }
        } else {
          const errorText = await response.text();
          console.log(`❌ Erro: ${errorText}`);
        }
      } catch (fetchError) {
        console.log(`❌ Erro na requisição: ${fetchError}`);
      }
    }

    // Testar query diretamente no banco
    console.log("\n🗄️ Testando query direta no banco...");
    
    // Simular a query que deveria estar funcionando
    const testEndpoint = '/api/store/products?limit=5';
    const directResponse = await fetch(`http://localhost:8080${testEndpoint}`);
    
    if (directResponse.ok) {
      const directData = await directResponse.json();
      console.log("✅ Query direta funcionou!");
      
      if (Array.isArray(directData)) {
        console.log(`📊 ${directData.length} produtos retornados`);
        
        directData.forEach((product: any, index: number) => {
          console.log(`${index + 1}. ${product.name} (ID: ${product.id})`);
          console.log(`   - Venda infinita: ${product.sell_without_stock ? 'SIM' : 'NÃO'}`);
          console.log(`   - Estoque: ${product.total_stock || 0}`);
          console.log(`   - Ativo: ${product.active ? 'SIM' : 'NÃO'}`);
        });
      }
    } else {
      console.log("❌ Query direta falhou");
    }

  } catch (error) {
    console.error("❌ Erro no teste:", error);
  }
}

testStoreApiDetailed().then(() => {
  console.log("🏁 Teste finalizado");
  process.exit(0);
}).catch((error) => {
  console.error("💥 Erro fatal:", error);
  process.exit(1);
});
