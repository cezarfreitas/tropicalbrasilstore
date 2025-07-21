import db from "../lib/db";

async function testAPI() {
  try {
    console.log("🧪 Testando se a API retorna fotos...");

    // Simulate the store API query
    const [products] = await db.execute(`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.base_price,
        p.suggested_price,
        p.photo,
        p.active,
        c.name as category_name,
        COUNT(DISTINCT pv.id) as variant_count,
        SUM(pv.stock) as total_stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      WHERE p.active = true
      GROUP BY p.id, p.name, p.description, p.base_price, p.suggested_price, p.photo, p.active, c.name
      HAVING SUM(pv.stock) > 0
      ORDER BY p.name
      LIMIT 5
    `);

    console.log("📋 Produtos retornados pela API:");
    console.table(products);

    // Test product detail API
    console.log("\n🔍 Testando API de detalhes do produto:");
    const [productDetail] = await db.execute(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = (SELECT id FROM products WHERE photo IS NOT NULL LIMIT 1) 
      AND p.active = true
    `);

    console.table(productDetail);

    process.exit(0);
  } catch (error) {
    console.error("❌ Erro no teste da API:", error);
    process.exit(1);
  }
}

testAPI();
