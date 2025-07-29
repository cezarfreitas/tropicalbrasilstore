const API_BASE_URL = "http://localhost:8080";
const API_KEY = "your_api_key_here";

const testData = {
  products: [
    {
      codigo: "TEST001",
      nome: "Chinelo Teste Grade",
      categoria: "Chinelos",
      tipo: "Casual",
      genero: "Unissex",
      descricao: "Produto de teste para estoque por grade",
      preco_sugerido: 39.90,
      vender_infinito: false,
      tipo_estoque: "grade",
      variantes: [
        {
          cor: "Azul Teste",
          preco: 29.90,
          grade: "Grade Unissex",
          estoque_grade: 25
        },
        {
          cor: "Verde Teste",
          preco: 29.90,
          grade: "Grade Unissex",
          estoque_grade: 30
        }
      ]
    },
    {
      codigo: "TEST002",
      nome: "Tênis Teste Tamanho",
      categoria: "Calçados",
      tipo: "Esportivo",
      genero: "Unissex",
      descricao: "Produto de teste para estoque por tamanho",
      preco_sugerido: 199.90,
      tipo_estoque: "size",
      variantes: [
        {
          cor: "Branco Teste",
          preco: 179.90,
          grade: "Grade Adulto",
          estoque_tamanhos: {
            "37": 3,
            "38": 5,
            "39": 8,
            "40": 6,
            "41": 4,
            "42": 2
          }
        }
      ]
    }
  ]
};

async function testBulkAPI() {
  try {
    console.log("🧪 Testando API /api/products/bulk com novos tipos de estoque...\n");
    
    const response = await fetch(`${API_BASE_URL}/api/products/bulk`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify(testData)
    });
    
    const responseText = await response.text();
    
    if (response.ok) {
      const result = JSON.parse(responseText);
      console.log("✅ Sucesso! Produtos criados:");
      console.log(JSON.stringify(result, null, 2));
      
      // Verificar os produtos criados
      console.log("\n📋 Resumo:");
      if (result.data) {
        console.log(`• Produtos criados: ${result.data.produtos_criados || 0}`);
        console.log(`• Variantes criadas: ${result.data.variantes_criadas || 0}`);
        console.log(`• Cores criadas: ${result.data.cores_criadas?.join(', ') || 'Nenhuma'}`);
      }
      
    } else {
      console.log("❌ Erro na API:");
      console.log(`Status: ${response.status}`);
      console.log(`Response: ${responseText}`);
    }
    
  } catch (error) {
    console.error("❌ Erro:", error);
  }
}

async function verifyProductsInDatabase() {
  try {
    console.log("\n🔍 Verificando produtos criados na loja...");
    
    const response = await fetch(`${API_BASE_URL}/api/store/products?limit=10`);
    
    if (response.ok) {
      const result = await response.json();
      
      const testProducts = result.products.filter((p: any) => 
        p.name.includes('Teste')
      );
      
      console.log(`\n📦 Produtos de teste encontrados: ${testProducts.length}`);
      
      testProducts.forEach((product: any) => {
        console.log(`\n• ${product.name} (ID: ${product.id})`);
        console.log(`  Tipo de estoque: ${product.stock_type || 'não definido'}`);
        console.log(`  Estoque total: ${product.total_stock || 0}`);
        console.log(`  Cores disponíveis: ${product.available_colors?.length || 0}`);
      });
      
    } else {
      console.log("❌ Erro ao verificar produtos na loja");
    }
    
  } catch (error) {
    console.error("❌ Erro:", error);
  }
}

// Executar testes
async function runTests() {
  await testBulkAPI();
  await verifyProductsInDatabase();
}

runTests();
