import db from "../lib/db";

async function checkVariantImages() {
  try {
    console.log("🖼️  Checking variant images...");
    
    // Get product with variants and their image URLs
    const [variants] = await db.execute(`
      SELECT 
        p.id as product_id,
        p.name as product_name,
        pcv.id as variant_id,
        pcv.image_url,
        c.name as color_name,
        c.hex_code
      FROM products p
      LEFT JOIN product_color_variants pcv ON p.id = pcv.product_id
      LEFT JOIN colors c ON pcv.color_id = c.id
      WHERE p.id = 107
      ORDER BY c.name
    `);
    
    const variantData = variants as any[];
    
    console.log("\n📋 Product Variants and Images:");
    console.log("===============================");
    
    for (const variant of variantData) {
      console.log(`Product: ${variant.product_name} (ID: ${variant.product_id})`);
      console.log(`  Color: ${variant.color_name} (${variant.hex_code})`);
      console.log(`  Image URL: ${variant.image_url || 'NOT SET'}`);
      console.log(`  Variant ID: ${variant.variant_id}`);
      console.log('---');
    }
    
    // Also check what the API is returning
    const [apiData] = await db.execute(`
      SELECT DISTINCT
        co.id,
        co.name,
        co.hex_code,
        pcv.image_url
      FROM product_color_variants pcv
      LEFT JOIN colors co ON pcv.color_id = co.id
      WHERE pcv.product_id = 107 AND pcv.active = true AND co.id IS NOT NULL
      ORDER BY co.name
    `);
    
    console.log("\n🔗 API Data Being Returned:");
    console.log("============================");
    for (const row of apiData as any[]) {
      console.log(`Color: ${row.name} - Image: ${row.image_url || 'NOT SET'}`);
    }
    
    return { variants: variantData, apiData };
  } catch (error) {
    console.error("❌ Error checking variant images:", error);
    throw error;
  }
}

checkVariantImages()
  .then(() => {
    console.log("\n✅ Check completed!");
    process.exit(0);
  })
  .catch(error => {
    console.error("❌ Failed:", error);
    process.exit(1);
  });
