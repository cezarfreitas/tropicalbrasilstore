import db from "./db";

export async function createProductVariantsTable() {
  try {
    // Check if product_variants table exists
    const [tables] = await db.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'product_variants'
    `);

    if ((tables as any[]).length > 0) {
      console.log("✅ product_variants table already exists");
      return;
    }

    console.log("📦 Creating product_variants table...");

    // Create product_variants table
    await db.execute(`
      CREATE TABLE product_variants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        size_id INT NOT NULL,
        color_id INT NOT NULL,
        stock INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (size_id) REFERENCES sizes(id) ON DELETE CASCADE,
        FOREIGN KEY (color_id) REFERENCES colors(id) ON DELETE CASCADE,
        UNIQUE KEY unique_variant (product_id, size_id, color_id)
      )
    `);

    console.log("✅ product_variants table created successfully");

    // Populate with sample data based on existing products, sizes, and colors
    console.log("📦 Populating product_variants with sample data...");

    const [products] = await db.execute("SELECT id FROM products WHERE active = true LIMIT 10");
    const [sizes] = await db.execute("SELECT id FROM sizes ORDER BY display_order LIMIT 5");
    const [colors] = await db.execute("SELECT id FROM colors LIMIT 5");

    const productsData = products as any[];
    const sizesData = sizes as any[];
    const colorsData = colors as any[];

    // Create variants for each product with all size/color combinations
    for (const product of productsData) {
      for (const size of sizesData) {
        for (const color of colorsData) {
          const stock = Math.floor(Math.random() * 100) + 10; // Random stock between 10-109
          
          await db.execute(`
            INSERT IGNORE INTO product_variants (product_id, size_id, color_id, stock)
            VALUES (?, ?, ?, ?)
          `, [product.id, size.id, color.id, stock]);
        }
      }
    }

    const [variantCount] = await db.execute("SELECT COUNT(*) as count FROM product_variants");
    console.log(`✅ Created ${(variantCount as any)[0].count} product variants`);

  } catch (error) {
    console.error("❌ Error creating product_variants table:", error);
    throw error;
  }
}
