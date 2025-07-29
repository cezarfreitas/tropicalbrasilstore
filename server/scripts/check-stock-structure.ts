import db from "../lib/db";

async function checkStockStructure() {
  try {
    console.log("🔍 Verificando estrutura das tabelas de estoque...");
    
    // Verificar estrutura da tabela products
    console.log("\n📦 Estrutura da tabela products:");
    const [productColumns] = await db.execute(`
      SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products'
      ORDER BY ORDINAL_POSITION
    `);
    console.table(productColumns);
    
    // Verificar estrutura da tabela product_variants
    console.log("\n📏 Estrutura da tabela product_variants:");
    const [variantColumns] = await db.execute(`
      SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_variants'
      ORDER BY ORDINAL_POSITION
    `);
    console.table(variantColumns);
    
    // Verificar estrutura da tabela grade_templates
    console.log("\n📊 Estrutura da tabela grade_templates:");
    const [gradeColumns] = await db.execute(`
      SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'grade_templates'
      ORDER BY ORDINAL_POSITION
    `);
    console.table(gradeColumns);
    
    // Verificar produtos existentes e seus estoques
    console.log("\n🎯 Exemplo de produtos e estoques:");
    const [sampleData] = await db.execute(`
      SELECT 
        p.id,
        p.name,
        p.sell_without_stock,
        COUNT(DISTINCT pv.id) as variant_count,
        SUM(pv.stock) as total_variant_stock,
        COUNT(DISTINCT pcg.id) as grade_count
      FROM products p
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      LEFT JOIN product_color_grades pcg ON p.id = pcg.product_id
      WHERE p.active = 1
      GROUP BY p.id, p.name, p.sell_without_stock
      LIMIT 5
    `);
    console.table(sampleData);
    
  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await db.end();
  }
}

checkStockStructure();
