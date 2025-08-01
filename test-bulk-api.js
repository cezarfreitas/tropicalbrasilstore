const fetch = require('node-fetch');

async function testBulkAPI() {
  try {
    const response = await fetch('http://localhost:8080/api/products/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'test-key'
      },
      body: JSON.stringify({
        "products": [{
          "codigo": "TEST001", 
          "nome": "Produto Teste",
          "categoria": "Teste",
          "tipo": "Sandália",
          "genero": "Feminina",
          "variantes": [{
            "cor": "AZUL",
            "preco": 10.50,
            "grade": "35,36"
          }]
        }]
      })
    });

    const result = await response.text();
    console.log('Status:', response.status);
    console.log('Response:', result);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testBulkAPI();
