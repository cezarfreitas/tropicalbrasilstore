import db from "../lib/db";

async function testFlexibleStockSystem() {
  try {
    console.log("🧪 Testando sistema de estoque flexível...");
    
    // Verificar produtos existentes e seus tipos de estoque
    const [products] = await db.execute(`
      SELECT 
        p.id,
        p.name,
        p.stock_type,
        p.sell_without_stock,
        COUNT(DISTINCT pcg.id) as grade_combinations,
        COUNT(DISTINCT pv.id) as size_variants
      FROM products p
      LEFT JOIN product_color_grades pcg ON p.id = pcg.product_id
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      WHERE p.active = 1
      GROUP BY p.id, p.name, p.stock_type, p.sell_without_stock
      ORDER BY p.name
    `);
    
    console.log("\n📋 Produtos no sistema:");
    console.table(products);
    
    // Testar estoque por grade
    console.log("\n🔍 Testando estoque por grade...");
    const [gradeProducts] = await db.execute(`
      SELECT 
        p.name as produto,
        g.name as grade,
        c.name as cor,
        pcg.stock_quantity
      FROM products p
      INNER JOIN product_color_grades pcg ON p.id = pcg.product_id
      INNER JOIN grade_vendida g ON pcg.grade_id = g.id
      INNER JOIN colors c ON pcg.color_id = c.id
      WHERE p.stock_type = 'grade'
      ORDER BY p.name, g.name, c.name
    `);
    
    console.log("📦 Estoque por grade:");
    console.table(gradeProducts);
    
    // Testar estoque por tamanho
    console.log("\n🔍 Testando estoque por tamanho...");
    const [sizeProducts] = await db.execute(`
      SELECT 
        p.name as produto,
        s.size as tamanho,
        c.name as cor,
        pv.stock as estoque
      FROM products p
      INNER JOIN product_variants pv ON p.id = pv.product_id
      INNER JOIN sizes s ON pv.size_id = s.id
      INNER JOIN colors c ON pv.color_id = c.id
      WHERE p.stock_type = 'size' AND pv.stock > 0
      ORDER BY p.name, s.display_order, c.name
      LIMIT 10
    `);
    
    console.log("👟 Estoque por tamanho (amostra):");
    console.table(sizeProducts);
    
    // Simular consulta da API store-simple para produtos com estoque
    console.log("\n🌐 Simulando consulta da API store...");
    const [storeProducts] = await db.execute(`
      SELECT
        p.id,
        p.name,
        p.stock_type,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.active = true
      AND (
        CASE
          WHEN p.stock_type = 'size' THEN EXISTS(
            SELECT 1 FROM product_variants pv
            WHERE pv.product_id = p.id AND (pv.stock > 0 OR p.sell_without_stock = 1)
          )
          WHEN p.stock_type = 'grade' THEN EXISTS(
            SELECT 1 FROM product_color_grades pcg
            INNER JOIN grade_vendida g ON pcg.grade_id = g.id
            WHERE pcg.product_id = p.id AND g.active = 1 AND (pcg.stock_quantity > 0 OR p.sell_without_stock = 1)
          )
          ELSE FALSE
        END
      )
      ORDER BY p.name
    `);
    
    console.log("🛒 Produtos disponíveis na loja:");
    console.table(storeProducts);
    
    // Resumo final
    const [summary] = await db.execute(`
      SELECT 
        stock_type,
        COUNT(*) as total_products,
        COUNT(CASE WHEN sell_without_stock = 1 THEN 1 END) as infinite_stock_products
      FROM products 
      WHERE active = 1 
      GROUP BY stock_type
    `);
    
    console.log("\n📊 Resumo do sistema:");
    console.table(summary);
    
  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await db.end();
  }
}

testFlexibleStockSystem();
