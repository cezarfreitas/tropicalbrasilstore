import db from "../lib/db";

async function checkProductColors() {
  try {
    console.log("🔍 Checking product color assignments...");
    
    // Get all products with their color variants
    const [products] = await db.execute(`
      SELECT 
        p.id,
        p.name as product_name,
        pcv.id as variant_id,
        c.id as color_id,
        c.name as color_name,
        c.hex_code
      FROM products p
      LEFT JOIN product_color_variants pcv ON p.id = pcv.product_id
      LEFT JOIN colors c ON pcv.color_id = c.id
      WHERE pcv.id IS NOT NULL
      ORDER BY p.name, c.name
    `);
    
    const productData = products as any[];
    
    // Group by product
    const groupedProducts: { [key: string]: any } = {};
    
    for (const row of productData) {
      if (!groupedProducts[row.product_name]) {
        groupedProducts[row.product_name] = {
          id: row.id,
          name: row.product_name,
          colors: []
        };
      }
      
      groupedProducts[row.product_name].colors.push({
        id: row.color_id,
        name: row.color_name,
        hex_code: row.hex_code
      });
    }
    
    console.log("\n📊 Current Product Color Assignments:");
    console.log("=====================================");
    
    for (const [productName, product] of Object.entries(groupedProducts)) {
      console.log(`\n🏷️  ${productName} (ID: ${product.id})`);
      console.log("   Colors assigned:");
      
      for (const color of product.colors) {
        console.log(`   • ${color.name} (${color.hex_code}) - ID: ${color.id}`);
      }
    }
    
    console.log("\n");
    
    // Also show all available colors
    const [allColors] = await db.execute("SELECT id, name, hex_code FROM colors ORDER BY name");
    const colors = allColors as any[];
    
    console.log("🎨 Available Colors in Database:");
    console.log("===============================");
    
    for (const color of colors) {
      console.log(`${color.name} (${color.hex_code}) - ID: ${color.id}`);
    }
    
    return { products: groupedProducts, colors };
  } catch (error) {
    console.error("❌ Error checking product colors:", error);
    throw error;
  }
}

checkProductColors()
  .then(() => {
    console.log("\n✅ Check completed!");
    process.exit(0);
  })
  .catch(error => {
    console.error("❌ Failed:", error);
    process.exit(1);
  });
