// Simulate exactly what the frontend sends for the failing products
const testData = [
  {
    name: "Chinelo ABC Grade Completa",
    category_id: "Chinelos", 
    base_price: "15.00",
    sale_price: "25.90",
    photo_url: "https://exemplo.com/chinelo-abc.jpg",
    color: "preto",
    sku: "ABC001-PRETO",
    parent_sku: "ABC001",
    description: "Chinelo ABC vendido por grade completa",
    suggested_price: "29.90",
    brand_name: "ABC",
    gender_name: "Unissex",
    type_name: "Chinelo",
    grade_name: "2549",
    grade_stock: "30",
    variant_sku: "ABC001-PRETO-GRADE",
    color_price: "",
    color_sale_price: "",
    color_image_url: "https://exemplo.com/chinelo-abc-preto.jpg",
    sell_without_stock: "0",
    stock_type: "grade"
  },
  {
    name: "Sandália XYZ Grade Premium",
    category_id: "Sandálias",
    base_price: "35.00", 
    sale_price: "55.90",
    photo_url: "https://exemplo.com/sandalia-xyz.jpg",
    color: "marrom",
    sku: "XYZ002-MARROM",
    parent_sku: "XYZ002",
    description: "Sandália XYZ premium vendida por grade",
    suggested_price: "65.90",
    brand_name: "XYZ Premium",
    gender_name: "Feminino",
    type_name: "Sandália",
    grade_name: "2550",
    grade_stock: "15",
    variant_sku: "XYZ002-MARROM-GRADE",
    color_price: "49.90",
    color_sale_price: "45.90",
    color_image_url: "https://exemplo.com/sandalia-xyz-marrom.jpg",
    sell_without_stock: "0",
    stock_type: "grade"
  }
];

console.log('🧪 TESTE ESPECÍFICO PARA OS DADOS QUE ESTÃO FALHANDO');
console.log('📋 Dados que serão enviados:');
console.log(JSON.stringify(testData, null, 2));

// Save this data for manual testing
const fs = require('fs');
fs.writeFileSync('test-data.json', JSON.stringify({ data: testData }, null, 2));
console.log('💾 Dados salvos em test-data.json');

// Show curl command for manual testing
console.log('\n🚀 Para testar manualmente, execute:');
console.log('curl -X POST http://localhost:8001/api/import/products-grade \\');
console.log('  -H "Content-Type: application/json" \\');
console.log('  -d @test-data.json');

console.log('\n📊 Para monitorar o progresso:');
console.log('curl http://localhost:8001/api/import/progress');
