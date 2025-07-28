import db from "../lib/db";

async function testStoreAPI() {
  try {
    console.log("🧪 Testing store API response...");
    
    // Simulate exactly what the store API does
    const [products] = await db.execute(`
      SELECT 
        p.*,
        c.name as category_name
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.active = true AND p.id = 107
      ORDER BY p.created_at DESC 
      LIMIT 1
    `);
    
    const product = (products as any[])[0];
    
    if (!product) {
      console.log("❌ Product not found");
      return;
    }
    
    console.log(`📦 Product: ${product.name} (ID: ${product.id})`);
    
    // Test WooCommerce color variants first
    const [wooColorRows] = await db.execute(
      `
      SELECT DISTINCT
        co.id,
        co.name,
        co.hex_code,
        pcv.image_url
      FROM product_color_variants pcv
      LEFT JOIN colors co ON pcv.color_id = co.id
      WHERE pcv.product_id = ? AND pcv.active = true AND co.id IS NOT NULL
      ORDER BY co.name
    `,
      [product.id],
    );
    
    console.log("\n🎨 WooCommerce variants found:", (wooColorRows as any[]).length);
    for (const color of wooColorRows as any[]) {
      console.log(`  - ${color.name} (${color.hex_code}) - Image: ${color.image_url || 'NOT SET'}`);
    }
    
    // Test old system fallback
    const [oldColorRows] = await db.execute(
      `
      SELECT DISTINCT
        co.id,
        co.name,
        co.hex_code
      FROM product_variants pv
      LEFT JOIN colors co ON pv.color_id = co.id
      WHERE pv.product_id = ? AND pv.stock > 0 AND co.id IS NOT NULL
      ORDER BY co.name
    `,
      [product.id],
    );
    
    console.log("\n🔄 Old system variants found:", (oldColorRows as any[]).length);
    for (const color of oldColorRows as any[]) {
      console.log(`  - ${color.name} (${color.hex_code})`);
    }
    
    // Show which one would be used
    const finalColorRows = (wooColorRows as any[]).length > 0 ? wooColorRows : oldColorRows;
    console.log(`\n✅ Final result being returned (${finalColorRows.length > 0 ? 'WooCommerce' : 'Old'} system):`);
    for (const color of finalColorRows as any[]) {
      console.log(`  - ${color.name} (${color.hex_code}) - Image: ${(color as any).image_url || 'N/A'}`);
    }
    
    return { product, wooColors: wooColorRows, oldColors: oldColorRows, final: finalColorRows };
  } catch (error) {
    console.error("❌ Error testing store API:", error);
    throw error;
  }
}

testStoreAPI()
  .then(() => {
    console.log("\n🏁 Store API test completed!");
    process.exit(0);
  })
  .catch(error => {
    console.error("❌ Failed:", error);
    process.exit(1);
  });
