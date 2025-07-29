import db from "../lib/db";

async function updateGradeStockSystem() {
  try {
    console.log("🔧 Atualizando sistema de estoque por grade para quantidade padrão...");
    
    // Verificar se a coluna grade_stock_quantity já existe na tabela products
    const [existingColumns] = await db.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'products' 
        AND COLUMN_NAME = 'grade_stock_quantity'
    `);
    
    if ((existingColumns as any[]).length === 0) {
      // Adicionar coluna para quantidade padrão de grade
      await db.execute(`
        ALTER TABLE products 
        ADD COLUMN grade_stock_quantity INT DEFAULT 25 
        COMMENT 'Quantidade padrão de estoque por grade (independente de tamanhos)'
      `);
      console.log("✅ Coluna grade_stock_quantity adicionada");
    } else {
      console.log("ℹ️ Coluna grade_stock_quantity já existe");
    }
    
    // Atualizar produtos existentes que usam estoque por grade
    const [gradeProducts] = await db.execute(`
      SELECT p.id, p.name, p.stock_type 
      FROM products p 
      WHERE p.stock_type = 'grade' AND p.active = 1
    `);
    
    console.log(`📦 Encontrados ${(gradeProducts as any[]).length} produtos com estoque por grade`);
    
    // Configurar quantidade padrão de 25 para produtos de grade
    await db.execute(`
      UPDATE products 
      SET grade_stock_quantity = 25 
      WHERE stock_type = 'grade' AND active = 1
    `);
    
    console.log("✅ Quantidade padrão de 25 configurada para produtos de grade");
    
    // Verificar resultado
    const [result] = await db.execute(`
      SELECT 
        stock_type,
        COUNT(*) as product_count,
        AVG(grade_stock_quantity) as avg_grade_stock,
        MIN(grade_stock_quantity) as min_grade_stock,
        MAX(grade_stock_quantity) as max_grade_stock
      FROM products 
      WHERE active = 1 
      GROUP BY stock_type
    `);
    
    console.log("\n📊 Resumo do sistema de estoque:");
    console.table(result);
    
    // Listar alguns produtos de exemplo
    const [examples] = await db.execute(`
      SELECT 
        p.name,
        p.stock_type,
        p.grade_stock_quantity,
        COUNT(pcg.id) as grade_colors_count
      FROM products p
      LEFT JOIN product_color_grades pcg ON p.id = pcg.product_id
      WHERE p.active = 1 AND p.stock_type = 'grade'
      GROUP BY p.id, p.name, p.stock_type, p.grade_stock_quantity
      LIMIT 5
    `);
    
    console.log("\n🔍 Exemplos de produtos com estoque por grade:");
    console.table(examples);
    
  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await db.end();
  }
}

updateGradeStockSystem();
