import fs from 'fs';
import path from 'path';

// Criar CSV de teste com os novos campos de estoque
const csvContent = `Nome do Produto,Categoria,Preço Base,Preço de Venda,URL da Foto,Grupo de Tamanhos,Cor (uma por linha),SKU,SKU Pai,Descrição,Preço Sugerido,Tipo de Estoque (grade/size),Estoque por Grade,Estoque Tam 37,Estoque Tam 38,Estoque Tam 39,Estoque Tam 40,Estoque Tam 41,Estoque Tam 42,Estoque Tam 43,Estoque Tam 44,Estoque por Variante (DEPRECATED)
"Chinelo Teste Grade","1","20.00","29.90","","1","azul","TEST001-AZUL","TEST001","Produto de teste para estoque por grade","39.90","grade","25","","","","","","","","",""
"Chinelo Teste Grade","1","20.00","29.90","","1","vermelho","TEST001-VERMELHO","TEST001","Produto de teste para estoque por grade","39.90","grade","30","","","","","","","","",""
"Tênis Teste Tamanho","2","100.00","149.90","","2","branco","TEST002-BRANCO","TEST002","Produto de teste para estoque por tamanho","199.90","size","","3","5","8","10","6","4","2","1",""
"Tênis Teste Tamanho","2","100.00","149.90","","2","preto","TEST002-PRETO","TEST002","Produto de teste para estoque por tamanho","199.90","size","","4","6","10","12","8","5","3","2",""`;

const outputPath = path.join(__dirname, '..', 'uploads', 'test-stock-types.csv');

try {
  // Criar diretório se não existir
  const uploadDir = path.dirname(outputPath);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Escrever arquivo CSV
  fs.writeFileSync(outputPath, csvContent, 'utf-8');
  
  console.log('✅ Arquivo CSV de teste criado com sucesso!');
  console.log(`📁 Localização: ${outputPath}`);
  console.log('\n📋 Conteúdo do arquivo:');
  console.log('─'.repeat(80));
  
  // Mostrar as primeiras linhas formatadas
  const lines = csvContent.split('\n');
  const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
  
  console.log('🔤 Cabeçalhos:');
  headers.forEach((header, index) => {
    console.log(`  ${index + 1}. ${header}`);
  });
  
  console.log('\n📊 Dados de exemplo:');
  lines.slice(1, 3).forEach((line, lineIndex) => {
    const values = line.split(',').map(v => v.replace(/"/g, ''));
    console.log(`\nLinha ${lineIndex + 2}:`);
    console.log(`  Produto: ${values[0]}`);
    console.log(`  Cor: ${values[6]}`);
    console.log(`  Tipo Estoque: ${values[11]}`);
    console.log(`  Estoque Grade: ${values[12] || 'N/A'}`);
    console.log(`  Estoques por Tamanho: ${values.slice(13, 21).filter(v => v).join(', ') || 'N/A'}`);
  });
  
  console.log('\n🧪 Para testar:');
  console.log('1. Acesse /admin/products/import');
  console.log('2. Faça upload deste arquivo CSV');
  console.log('3. Mapeie as colunas corretamente');
  console.log('4. Execute a importação');
  console.log('5. Verifique se os produtos foram criados com os tipos de estoque corretos');

} catch (error) {
  console.error('❌ Erro ao criar arquivo CSV:', error);
}
