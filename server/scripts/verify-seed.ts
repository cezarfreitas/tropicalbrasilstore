import db from "../lib/db";

async function verifySeed() {
  try {
    console.log("🔍 Verificando resultados do seed...");

    // Count products
    const [productsResult] = await db.execute(
      "SELECT COUNT(*) as count FROM products",
    );
    const productCount = (productsResult as any)[0].count;
    console.log(`📦 Produtos: ${productCount}`);

    // Count variants
    const [variantsResult] = await db.execute(
      "SELECT COUNT(*) as count FROM product_variants",
    );
    const variantCount = (variantsResult as any)[0].count;
    console.log(`🔗 Variantes: ${variantCount}`);

    // Count product-color-grades associations
    const [gradesResult] = await db.execute(
      "SELECT COUNT(*) as count FROM product_color_grades",
    );
    const gradesCount = (gradesResult as any)[0].count;
    console.log(`📊 Associações produto-cor-grade: ${gradesCount}`);

    // Show some sample products
    console.log("\n📋 Alguns produtos inseridos:");
    const [sampleProducts] = await db.execute(`
      SELECT p.name, p.base_price, p.suggested_price, p.sku 
      FROM products p 
      WHERE p.sku LIKE '%-%' 
      ORDER BY p.id DESC 
      LIMIT 10
    `);
    console.table(sampleProducts);

    // Show stock distribution
    console.log("\n📊 Distribuição de estoque por tamanho:");
    const [stockResult] = await db.execute(`
      SELECT s.size, SUM(pv.stock) as total_stock, AVG(pv.stock) as avg_stock
      FROM product_variants pv
      JOIN sizes s ON pv.size_id = s.id
      GROUP BY s.id, s.size
      ORDER BY s.display_order
    `);
    console.table(stockResult);

    console.log("\n✅ Verificação concluída!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro na verificação:", error);
    process.exit(1);
  }
}

verifySeed();
