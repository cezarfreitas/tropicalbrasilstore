const https = require('https');

// Test single product format
const singleProduct = {
  "row_number": 2,
  "codigo": "TB1.2522",
  "nome": "Logo",
  "categoria": "Logo",
  "tipo": "Sandália",
  "genero": "Feminina",
  "marca": "Tropical Brasil",
  "descricao": "Chinelo Havaianas Top tradicional, confortável e durável. Material borracha de alta qualidade.",
  "preco_sugerido": "",
  "vender_infinito": true,
  "tipo_estoque": "grade",
  "cor": "Azul Elemental",
  "preco": "R$ 13,60",
  "grade": "2647, 2637",
  "sku": "",
  "estoque_grade": "",
  "foto": "https://projetoinfluencer.vteximg.com.br/arquivos/ids/6371104-640-960/Chinelo-Tropical-Brasil-Todo-Dia-Branco-com-Preto.jpg"
};

function testBulkAPI() {
  console.log('🧪 Testing new bulk API format...');
  
  const postData = JSON.stringify(singleProduct);
  
  const options = {
    hostname: 'ide-b2b-tb.jzo3qo.easypanel.host',
    port: 443,
    path: '/api/products/bulk',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'Accept': 'application/json',
      'User-Agent': 'Test-Script/1.0'
    }
  };

  const req = https.request(options, (res) => {
    console.log(`📡 Status Code: ${res.statusCode}`);
    
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log('\n✅ Response:');
        console.log(JSON.stringify(response, null, 2));
      } catch (error) {
        console.error('❌ Error parsing response:', error.message);
        console.log('📋 Raw response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Request error:', error.message);
  });

  req.setTimeout(30000, () => {
    console.log('⏰ Request timeout');
    req.destroy();
  });

  console.log('📤 Sending data:', JSON.stringify(singleProduct, null, 2));
  req.write(postData);
  req.end();
}

testBulkAPI();
