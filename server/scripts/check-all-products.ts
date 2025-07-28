import db from "../lib/db";

async function checkAllProducts() {
  try {
    console.log("🔍 Checking all products and their colors...");
    
    // Get all products with color data
    const query = `
      SELECT 
        p.id,
        p.name,
        GROUP_CONCAT(DISTINCT co.name ORDER BY co.name) as available_colors,
        GROUP_CONCAT(DISTINCT CONCAT(co.name, ':', co.hex_code) ORDER BY co.name) as color_data
      FROM products p
      LEFT JOIN product_color_variants pcv ON p.id = pcv.product_id
      LEFT JOIN colors co ON pcv.color_id = co.id
      GROUP BY p.id, p.name
      ORDER BY p.name
    `;
    
    const [products] = await db.execute(query);
    const productList = products as any[];
    
    console.log("\n📋 All Products and Their Colors:");
    console.log("================================");
    
    for (const product of productList) {
      console.log(`\n🏷️  ${product.name} (ID: ${product.id})`);
      console.log(`   Available Colors: ${product.available_colors || 'None'}`);
      console.log(`   Color Data: ${product.color_data || 'None'}`);
    }
    
    // Look for products with "Brasil" in the name
    const brasilProducts = productList.filter(p => 
      p.name.toLowerCase().includes('brasil')
    );
    
    if (brasilProducts.length > 0) {
      console.log("\n🇧🇷 Products with 'Brasil' in name:");
      console.log("==================================");
      for (const product of brasilProducts) {
        console.log(`${product.name} (ID: ${product.id}) - Colors: ${product.available_colors}`);
      }
    }
    
    return productList;
  } catch (error) {
    console.error("❌ Error checking products:", error);
    throw error;
  }
}

checkAllProducts()
  .then(() => {
    console.log("\n✅ Check completed!");
    process.exit(0);
  })
  .catch(error => {
    console.error("❌ Failed:", error);
    process.exit(1);
  });
