import db from "../lib/db";

async function updateFlexibleStockSystem() {
  try {
    console.log("🔧 Atualizando para sistema de estoque flexível...");
    
    // Remover a coluna grade_stock_quantity se existir (era muito específica)
    const [existingColumns] = await db.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'products' 
        AND COLUMN_NAME = 'grade_stock_quantity'
    `);
    
    if ((existingColumns as any[]).length > 0) {
      await db.execute(`
        ALTER TABLE products 
        DROP COLUMN grade_stock_quantity
      `);
      console.log("✅ Coluna grade_stock_quantity removida - usando sistema flexível");
    }
    
    // Verificar se precisamos adicionar coluna de estoque nas tabelas de grade
    const [gradeStockColumns] = await db.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'product_color_grades' 
        AND COLUMN_NAME = 'stock_quantity'
    `);
    
    if ((gradeStockColumns as any[]).length === 0) {
      // Adicionar coluna de estoque na tabela product_color_grades
      await db.execute(`
        ALTER TABLE product_color_grades 
        ADD COLUMN stock_quantity INT DEFAULT 0 
        COMMENT 'Quantidade em estoque para esta combinação grade/cor'
      `);
      console.log("✅ Coluna stock_quantity adicionada em product_color_grades");
    } else {
      console.log("ℹ️ Coluna stock_quantity já existe em product_color_grades");
    }
    
    // Configurar alguns dados de exemplo para testar
    console.log("\n��� Configurando dados de exemplo...");
    
    // Para o produto Chinelo Havaianas Top (estoque por grade)
    const [havarianasProduct] = await db.execute(`
      SELECT id FROM products 
      WHERE name LIKE '%Havaianas%' AND stock_type = 'grade' 
      LIMIT 1
    `);
    
    if ((havarianasProduct as any[]).length > 0) {
      const productId = (havarianasProduct as any[])[0].id;
      
      // Atualizar estoque das grades existentes
      await db.execute(`
        UPDATE product_color_grades 
        SET stock_quantity = 25 
        WHERE product_id = ? AND stock_quantity = 0
      `, [productId]);
      
      console.log(`✅ Estoque de grades configurado para produto ${productId}`);
    }
    
    // Verificar estrutura final
    const [finalStructure] = await db.execute(`
      SELECT 
        p.name,
        p.stock_type,
        COUNT(DISTINCT pcg.id) as grade_combinations,
        COUNT(DISTINCT pv.id) as size_variants,
        SUM(pcg.stock_quantity) as total_grade_stock,
        SUM(pv.stock) as total_size_stock
      FROM products p
      LEFT JOIN product_color_grades pcg ON p.id = pcg.product_id
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      WHERE p.active = 1
      GROUP BY p.id, p.name, p.stock_type
      LIMIT 5
    `);
    
    console.log("\n📊 Estrutura final do sistema de estoque:");
    console.table(finalStructure);
    
    // Mostrar exemplo específico do sistema
    const [gradeExample] = await db.execute(`
      SELECT 
        p.name as produto,
        p.stock_type,
        g.name as grade,
        c.name as cor,
        pcg.stock_quantity as estoque_grade
      FROM products p
      INNER JOIN product_color_grades pcg ON p.id = pcg.product_id
      INNER JOIN grade_vendida g ON pcg.grade_id = g.id
      INNER JOIN colors c ON pcg.color_id = c.id
      WHERE p.stock_type = 'grade'
      LIMIT 5
    `);
    
    console.log("\n🔍 Exemplo de estoque por grade:");
    console.table(gradeExample);
    
  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await db.end();
  }
}

updateFlexibleStockSystem();
