const axios = require('axios');

// Test data exactly as provided by user
const testData = [
  {
    "Nome do Produto": "Chinelo ABC Grade Completa",
    "Categoria": "Chinelos", 
    "Preço Base": "15.00",
    "Preço de Venda": "25.90",
    "URL da Foto": "https://exemplo.com/chinelo-abc.jpg",
    "Cor": "preto",
    "SKU": "ABC001-PRETO",
    "SKU Pai": "ABC001",
    "Descrição": "Chinelo ABC vendido por grade completa",
    "Preço Sugerido": "29.90",
    "Marca": "ABC",
    "Gênero": "Unissex",
    "Tipo de Produto": "Chinelo",
    "Nome da Grade": "2549",
    "Estoque da Grade": "30",
    "SKU da Variante": "ABC001-PRETO-GRADE",
    "Preço da Cor": "",
    "Preço Promocional da Cor": "",
    "Imagem da Cor": "https://exemplo.com/chinelo-abc-preto.jpg",
    "Vender Sem Estoque (0/1)": "0"
  },
  {
    "Nome do Produto": "Sandália XYZ Grade Premium",
    "Categoria": "Sandálias",
    "Preço Base": "35.00", 
    "Preço de Venda": "55.90",
    "URL da Foto": "https://exemplo.com/sandalia-xyz.jpg",
    "Cor": "marrom",
    "SKU": "XYZ002-MARROM",
    "SKU Pai": "XYZ002",
    "Descrição": "Sandália XYZ premium vendida por grade",
    "Preço Sugerido": "65.90",
    "Marca": "XYZ Premium",
    "Gênero": "Feminino",
    "Tipo de Produto": "Sandália",
    "Nome da Grade": "2550",
    "Estoque da Grade": "15",
    "SKU da Variante": "XYZ002-MARROM-GRADE",
    "Preço da Cor": "49.90",
    "Preço Promocional da Cor": "45.90",
    "Imagem da Cor": "https://exemplo.com/sandalia-xyz-marrom.jpg",
    "Vender Sem Estoque (0/1)": "0"
  }
];

// Create the mapping that frontend would create
const fieldMapping = {
  "Nome do Produto": "name",
  "Categoria": "category_id", 
  "Preço Base": "base_price",
  "Preço de Venda": "sale_price",
  "URL da Foto": "photo_url",
  "Cor": "color",
  "SKU": "sku",
  "SKU Pai": "parent_sku",
  "Descrição": "description",
  "Preço Sugerido": "suggested_price",
  "Marca": "brand_name",
  "Gênero": "gender_name",
  "Tipo de Produto": "type_name",
  "Nome da Grade": "grade_name",
  "Estoque da Grade": "grade_stock",
  "SKU da Variante": "variant_sku",
  "Preço da Cor": "color_price",
  "Preço Promocional da Cor": "color_sale_price",
  "Imagem da Cor": "color_image_url",
  "Vender Sem Estoque (0/1)": "sell_without_stock"
};

// Transform data like frontend does
const transformedData = testData.map(row => {
  const processedRow = {};
  
  Object.keys(fieldMapping).forEach(excelHeader => {
    const targetField = fieldMapping[excelHeader];
    if (row[excelHeader] !== undefined) {
      processedRow[targetField] = row[excelHeader];
    }
  });
  
  // Ensure stock_type is set to 'grade'
  processedRow.stock_type = 'grade';
  
  return processedRow;
});

console.log('🔍 DADOS ORIGINAIS (Excel headers):');
console.log(JSON.stringify(testData[0], null, 2));

console.log('\n🔄 DADOS TRANSFORMADOS (backend expected fields):');
console.log(JSON.stringify(transformedData[0], null, 2));

console.log('\n🚀 Enviando para API...');

async function testImport() {
  try {
    const response = await axios.post('http://localhost:8001/api/import/products-grade', {
      data: transformedData
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('✅ Resposta da API:', response.data);
    
    // Monitor progress
    let isRunning = true;
    let iteration = 0;
    
    while (isRunning && iteration < 30) { // Max 30 seconds
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      try {
        const progressResponse = await axios.get('http://localhost:8001/api/import/progress');
        const progress = progressResponse.data;
        
        console.log(`📊 [${iteration + 1}] Progresso:`, {
          processed: progress.processed,
          success: progress.success,
          errors: progress.errors,
          current: progress.current,
          isRunning: progress.isRunning
        });
        
        if (progress.errorDetails && progress.errorDetails.length > 0) {
          console.log('❌ Erros encontrados:', progress.errorDetails);
        }
        
        isRunning = progress.isRunning;
        iteration++;
      } catch (progressError) {
        console.error('❌ Erro ao buscar progresso:', progressError.message);
        break;
      }
    }
    
    console.log('\n🏁 Processamento finalizado!');
    
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

testImport();
