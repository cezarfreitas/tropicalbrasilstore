import db from "../lib/db";

async function addStockTypeColumn() {
  try {
    console.log("🔧 Adicionando coluna stock_type à tabela products...");
    
    // Verificar se a coluna já existe
    const [existingColumns] = await db.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'products' 
        AND COLUMN_NAME = 'stock_type'
    `);
    
    if ((existingColumns as any[]).length > 0) {
      console.log("ℹ️ Coluna stock_type já existe");
    } else {
      // Adicionar a coluna stock_type
      await db.execute(`
        ALTER TABLE products 
        ADD COLUMN stock_type ENUM('size', 'grade') 
        DEFAULT 'grade' 
        COMMENT 'Tipo de controle de estoque: size (por tamanho) ou grade (por grade)'
      `);
      console.log("✅ Coluna stock_type adicionada com sucesso");
    }
    
    // Verificar a nova estrutura
    const [updatedColumns] = await db.execute(`
      SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_DEFAULT, COLUMN_COMMENT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'products' 
        AND COLUMN_NAME IN ('stock_type', 'sell_without_stock')
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log("📋 Colunas relacionadas ao estoque:");
    console.table(updatedColumns);
    
    // Configurar produtos existentes
    console.log("\n🔄 Configurando produtos existentes...");
    
    // Produtos que têm grades definidas devem usar stock_type = 'grade'
    const [gradeUpdate] = await db.execute(`
      UPDATE products p 
      SET stock_type = 'grade' 
      WHERE p.id IN (
        SELECT DISTINCT pcg.product_id 
        FROM product_color_grades pcg 
        INNER JOIN grade_vendida g ON pcg.grade_id = g.id 
        WHERE g.active = 1
      )
    `);
    
    console.log(`✅ ${(gradeUpdate as any).affectedRows} produtos configurados para estoque por grade`);
    
    // Produtos que só têm variantes individuais devem usar stock_type = 'size'
    const [sizeUpdate] = await db.execute(`
      UPDATE products p 
      SET stock_type = 'size' 
      WHERE p.id NOT IN (
        SELECT DISTINCT pcg.product_id 
        FROM product_color_grades pcg 
        INNER JOIN grade_vendida g ON pcg.grade_id = g.id 
        WHERE g.active = 1
      )
      AND p.id IN (
        SELECT DISTINCT pv.product_id 
        FROM product_variants pv 
        WHERE pv.stock > 0
      )
    `);
    
    console.log(`✅ ${(sizeUpdate as any).affectedRows} produtos configurados para estoque por tamanho`);
    
    // Mostrar resultado final
    const [finalResult] = await db.execute(`
      SELECT 
        stock_type,
        COUNT(*) as product_count,
        COUNT(CASE WHEN sell_without_stock = 1 THEN 1 END) as infinite_stock_count
      FROM products 
      WHERE active = 1 
      GROUP BY stock_type
    `);
    
    console.log("\n📊 Resumo dos tipos de estoque:");
    console.table(finalResult);
    
  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await db.end();
  }
}

addStockTypeColumn();
