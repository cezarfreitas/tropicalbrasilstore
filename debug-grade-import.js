const mysql = require('mysql2/promise');

// Conectar à base de dados
const connection = mysql.createPool({
  uri: "mysql://tropical:ceb404856425cc1f8472@148.230.78.129:3399/tropical",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 50,
  charset: "utf8mb4",
});

async function debugGradeImport() {
  try {
    console.log("🔍 Verificando estrutura do banco para importação de grades...");
    
    // Verificar tabelas essenciais
    const tables = [
      'products',
      'categories', 
      'colors',
      'brands',
      'genders',
      'types',
      'sizes',
      'product_variants',
      'product_color_variants',
      'product_color_grades',
      'grade_vendida'
    ];
    
    for (const table of tables) {
      try {
        const [result] = await connection.execute(`SHOW TABLES LIKE ?`, [table]);
        if (result.length === 0) {
          console.log(`❌ Tabela '${table}' NÃO existe!`);
        } else {
          console.log(`✅ Tabela '${table}' existe`);
          
          // Verificar estrutura da tabela products (mais importante)
          if (table === 'products') {
            const [columns] = await connection.execute(`DESCRIBE ${table}`);
            console.log(`📋 Estrutura da tabela products:`, columns.map(c => c.Field));
          }
        }
      } catch (error) {
        console.log(`❌ Erro ao verificar tabela '${table}':`, error.message);
      }
    }

    // Verificar se existem categorias
    try {
      const [categories] = await connection.execute("SELECT id, name FROM categories LIMIT 5");
      console.log(`📂 Categorias encontradas (${categories.length}):`, categories.map(c => `${c.id}: ${c.name}`));
    } catch (error) {
      console.log("❌ Erro ao buscar categorias:", error.message);
    }

    // Verificar se existem tamanhos padrão
    try {
      const [sizes] = await connection.execute("SELECT id, size FROM sizes WHERE size IN ('37', '38', '39', '40', '41', '42', '43', '44') ORDER BY size");
      console.log(`👟 Tamanhos padrão encontrados (${sizes.length}):`, sizes.map(s => `${s.id}: ${s.size}`));
    } catch (error) {
      console.log("❌ Erro ao buscar tamanhos:", error.message);
    }

    // Testar criação de produto simples
    console.log("\n🧪 Testando criação de produto simples...");
    const testData = {
      name: "Teste Grade Debug",
      category_id: "Chinelos", // Nome da categoria
      base_price: "15.00",
      color: "preto",
      grade_name: "Grade Test",
      grade_stock: "10"
    };

    console.log("📦 Dados de teste:", JSON.stringify(testData, null, 2));

    // Simular conversão de categoria
    try {
      const [categoryResult] = await connection.execute(
        "SELECT id FROM categories WHERE LOWER(name) = LOWER(?)",
        [testData.category_id]
      );
      
      if (categoryResult.length === 0) {
        console.log(`❌ Categoria '${testData.category_id}' não encontrada!`);
      } else {
        console.log(`✅ Categoria '${testData.category_id}' encontrada - ID: ${categoryResult[0].id}`);
      }
    } catch (error) {
      console.log("❌ Erro ao buscar categoria:", error.message);
    }

    console.log("\n✅ Verificação concluída!");

  } catch (error) {
    console.error("❌ Erro geral:", error);
  } finally {
    await connection.end();
  }
}

debugGradeImport();
