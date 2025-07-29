import db from "../lib/db";

async function checkStoreProducts() {
  try {
    console.log("🔍 Verificando produtos na loja...");
    
    // Verificar produtos ativos
    const [products] = await db.execute(`
      SELECT 
        p.id, 
        p.name, 
        p.photo, 
        p.base_price, 
        p.suggested_price, 
        p.active, 
        p.sell_without_stock,
        c.name as category_name,
        COUNT(pv.id) as variant_count,
        SUM(pv.stock) as total_stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      WHERE p.active = true
      GROUP BY p.id
    `);
    
    console.log("📦 Produtos encontrados:");
    console.table(products);
    
    // Verificar grades disponíveis para produto 150
    if ((products as any[]).length > 0) {
      const productId = (products as any[])[0].id;
      console.log(`\n🎯 Verificando grades para produto ${productId}...`);
      
      const [grades] = await db.execute(`
        SELECT DISTINCT
          g.id,
          g.name,
          g.description,
          c.name as color_name,
          c.hex_code,
          pcg.color_id,
          (
            SELECT COUNT(*) 
            FROM grade_templates gt 
            WHERE gt.grade_id = g.id AND gt.quantity > 0
          ) as template_count
        FROM grade_vendida g
        INNER JOIN product_color_grades pcg ON g.id = pcg.grade_id
        INNER JOIN colors c ON pcg.color_id = c.id
        WHERE pcg.product_id = ? AND g.active = true
      `, [productId]);
      
      console.log("📊 Grades disponíveis:");
      console.table(grades);
      
      // Verificar cores disponíveis
      const [colors] = await db.execute(`
        SELECT DISTINCT
          co.id,
          co.name,
          co.hex_code
        FROM product_variants pv
        LEFT JOIN colors co ON pv.color_id = co.id
        WHERE pv.product_id = ? AND co.id IS NOT NULL
        ORDER BY co.name
      `, [productId]);
      
      console.log("🎨 Cores disponíveis:");
      console.table(colors);
      
      // Verificar variantes WooCommerce
      const [wooVariants] = await db.execute(`
        SELECT
          pcv.id,
          pcv.color_id,
          pcv.stock_total,
          pcv.price,
          pcv.image_url,
          c.name as color_name
        FROM product_color_variants pcv
        LEFT JOIN colors c ON pcv.color_id = c.id
        WHERE pcv.product_id = ? AND pcv.active = true
      `, [productId]);
      
      console.log("🔄 Variantes WooCommerce:");
      console.table(wooVariants);
    }
    
  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await db.end();
  }
}

checkStoreProducts();
