import fetch from 'node-fetch';

async function testStockTypesAPI() {
  try {
    console.log("🔍 Testando API com tipos de estoque...");
    
    // Testar API de produtos
    console.log("\n📦 Testando /api/store-simple/products-paginated:");
    const response = await fetch('http://localhost:8080/api/store-simple/products-paginated?page=1&limit=10', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const result = await response.json();
      console.log("✅ Sucesso - Produtos encontrados:", result.products?.length || 0);
      
      if (result.products?.length > 0) {
        const product = result.products[0];
        console.log("\n📊 Primeiro produto:");
        console.log({
          id: product.id,
          name: product.name,
          stock_type: product.stock_type,
          sell_without_stock: product.sell_without_stock,
          available_colors: product.available_colors?.length || 0,
          available_grades_count: product.available_grades_count || 0,
          variant_count: product.variant_count,
          total_stock: product.total_stock
        });
        
        // Testar detalhes do produto
        console.log(`\n🔍 Testando detalhes do produto ${product.id}:`);
        const detailResponse = await fetch(`http://localhost:8080/api/store-simple/products/${product.id}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        if (detailResponse.ok) {
          const detailResult = await detailResponse.json();
          console.log("✅ Detalhes obtidos:");
          console.log({
            id: detailResult.id,
            name: detailResult.name,
            stock_type: detailResult.stock_type,
            variants: detailResult.variants?.length || 0,
            grades: detailResult.grades?.length || 0
          });
        } else {
          console.log("❌ Erro ao obter detalhes:", detailResponse.status);
        }
      }
    } else {
      console.log("❌ Erro na API:", response.status, await response.text());
    }

  } catch (error) {
    console.error("❌ Erro:", error);
  }
}

testStockTypesAPI();
