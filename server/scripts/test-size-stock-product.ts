import fetch from 'node-fetch';

async function testSizeStockProduct() {
  try {
    console.log("🧪 Testando criação de produto com estoque por tamanho...");
    
    const payload = {
      "products": [
        {
          "codigo": "TEN001",
          "nome": "Tênis Nike Air Max",
          "categoria": "Tênis",
          "tipo": "Esportivo",
          "genero": "Unissex",
          "descricao": "Tênis esportivo com tecnologia Air Max",
          "preco_sugerido": 299.90,
          "vender_infinito": false,
          "tipo_estoque": "size",
          "variantes": [
            {
              "cor": "Branco",
              "preco": 249.90,
              "grade": "Grade Tênis",
              "foto": "https://via.placeholder.com/400x400/ffffff/cccccc?text=Tenis+Branco"
            },
            {
              "cor": "Preto",
              "preco": 249.90,
              "grade": "Grade Tênis",
              "foto": "https://via.placeholder.com/400x400/000000/cccccc?text=Tenis+Preto"
            }
          ]
        }
      ]
    };

    console.log("📦 Criando produto com estoque por tamanho...");

    const response = await fetch('http://localhost:8080/api/products/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer sk_live_abcd1234567890abcdef1234567890abcdef12'
      },
      body: JSON.stringify(payload)
    });

    console.log("Status:", response.status);

    if (response.ok) {
      const result = await response.json();
      console.log("✅ Produto criado com sucesso!");
      console.log("Produtos processados:", result.data?.produtos_processados || 0);
      console.log("Produtos novos:", result.data?.produtos_novos || 0);
      console.log("Tipo de estoque definido: size");
      
      // Verificar se o produto foi criado corretamente
      if (result.data?.produtos && result.data.produtos.length > 0) {
        const productId = result.data.produtos[0].id;
        console.log(`\n🔍 Verificando produto criado (ID: ${productId})...`);
      }
    } else {
      const errorText = await response.text();
      console.log("❌ Erro:", response.status, errorText);
    }

  } catch (error) {
    console.error("❌ Erro na requisição:", error);
  }
}

testSizeStockProduct();
