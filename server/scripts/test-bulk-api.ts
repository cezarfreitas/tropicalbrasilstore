import fetch from 'node-fetch';

async function testBulkAPI() {
  try {
    const payload = {
      "products": [
        {
          "codigo": "CHN001",
          "nome": "Chinelo Havaianas Top",
          "categoria": "Chinelos",
          "tipo": "Casual",
          "genero": "Unissex",
          "descricao": "O chinelo mais famoso do Brasil",
          "preco_sugerido": 39.90,
          "vender_infinito": true,
          "variantes": [
            {
              "cor": "Preto",
              "preco": 29.90,
              "grade": "Grade Unissex",
              "foto": "https://img.irroba.com.br/fit-in/600x600/filters:fill(fff):quality(80)/reidosch/catalog/api/app-9741/655667a6a81b9.jpg"
            },
            {
              "cor": "Vermelho",
              "preco": 29.90,
              "grade": "Grade Unissex",
              "foto": "https://d2kh0jmrbw4y83.cloudfront.net/Custom/Content/Products/37/70/37709_sandalias-havaianas-brasil-vermelho-crush-3536-1264867_z2_637689569363814984.webp"
            }
          ]
        }
      ]
    };

    console.log("🔍 Testando API /api/products/bulk...");
    console.log("Payload:", JSON.stringify(payload, null, 2));

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
    console.log("Headers:", Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log("Response Body:", responseText);

    if (response.ok) {
      try {
        const result = JSON.parse(responseText);
        console.log("✅ Sucesso:", result);
      } catch (e) {
        console.log("✅ Resposta não é JSON válido, mas status OK");
      }
    } else {
      console.log("❌ Erro:", response.status, responseText);
    }

  } catch (error) {
    console.error("❌ Erro na requisição:", error);
  }
}

testBulkAPI();
