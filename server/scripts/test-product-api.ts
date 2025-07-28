import db from "../lib/db";

async function testProductAPI() {
  try {
    console.log("🧪 Testing product API response...");
    
    // Simulate the exact query from the products-woocommerce.ts route
    const query = `
      SELECT 
        p.*,
        c.name as category_name,
        COUNT(DISTINCT pcv.id) as variant_count,
        SUM(pcv.stock_total) as total_stock,
        COUNT(DISTINCT pcg.grade_id) as grade_count,
        GROUP_CONCAT(DISTINCT co.name ORDER BY co.name) as available_colors,
        GROUP_CONCAT(DISTINCT CONCAT(co.name, ':', co.hex_code) ORDER BY co.name) as color_data
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_color_variants pcv ON p.id = pcv.product_id
      LEFT JOIN colors co ON pcv.color_id = co.id
      LEFT JOIN product_color_grades pcg ON p.id = pcg.product_id
      WHERE p.id = 107
      GROUP BY p.id, c.name
    `;
    
    const [rows] = await db.execute(query);
    const product = (rows as any[])[0];
    
    console.log("\n📋 API Response for Product ID 107:");
    console.log("===================================");
    console.log(`Product Name: ${product.name}`);
    console.log(`Available Colors: ${product.available_colors}`);
    console.log(`Color Data: ${product.color_data}`);
    console.log(`Variant Count: ${product.variant_count}`);
    
    // Also check the color variants directly
    const [variants] = await db.execute(`
      SELECT 
        pcv.*,
        c.name as color_name,
        c.hex_code
      FROM product_color_variants pcv
      LEFT JOIN colors c ON pcv.color_id = c.id
      WHERE pcv.product_id = 107
      ORDER BY c.name
    `);
    
    console.log("\n🎨 Direct Color Variants Query:");
    console.log("==============================");
    for (const variant of variants as any[]) {
      console.log(`Color ID: ${variant.color_id} - ${variant.color_name} (${variant.hex_code})`);
    }
    
    return { product, variants };
  } catch (error) {
    console.error("❌ Error testing API:", error);
    throw error;
  }
}

testProductAPI()
  .then(() => {
    console.log("\n✅ API test completed!");
    process.exit(0);
  })
  .catch(error => {
    console.error("❌ Failed:", error);
    process.exit(1);
  });
