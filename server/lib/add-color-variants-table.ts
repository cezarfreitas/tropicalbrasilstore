import db from "./db";

export async function addColorVariantsTable() {
  try {
    // Check if product_color_variants table already exists
    const [tables] = await db.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'product_color_variants'
    `);

    if ((tables as any[]).length > 0) {
      console.log("✅ product_color_variants table already exists");
      return;
    }

    console.log("📦 Creating product_color_variants table (WooCommerce style)...");

    // Create product_color_variants table (WooCommerce style - only color variants)
    await db.execute(`
      CREATE TABLE product_color_variants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        color_id INT NOT NULL,
        variant_name VARCHAR(255) NOT NULL,
        variant_sku VARCHAR(100) NULL,
        price DECIMAL(10,2) NULL,
        sale_price DECIMAL(10,2) NULL,
        image_url VARCHAR(500) NULL,
        stock_total INT DEFAULT 0,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (color_id) REFERENCES colors(id) ON DELETE CASCADE,
        UNIQUE KEY unique_product_color (product_id, color_id)
      )
    `);

    console.log("✅ product_color_variants table created successfully");

    // Create product_variant_sizes table (stock per size for each color variant)
    await db.execute(`
      CREATE TABLE product_variant_sizes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        color_variant_id INT NOT NULL,
        size_id INT NOT NULL,
        stock INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (color_variant_id) REFERENCES product_color_variants(id) ON DELETE CASCADE,
        FOREIGN KEY (size_id) REFERENCES sizes(id) ON DELETE CASCADE,
        UNIQUE KEY unique_variant_size (color_variant_id, size_id)
      )
    `);

    console.log("✅ product_variant_sizes table created successfully");

    console.log("📦 Migrating existing data from product_variants to new structure...");

    // Migrate existing data from product_variants to new structure
    const [existingProducts] = await db.execute(`
      SELECT DISTINCT p.id, p.name 
      FROM products p 
      JOIN product_variants pv ON p.id = pv.product_id
    `);

    for (const product of existingProducts as any[]) {
      // Get unique colors for this product
      const [colors] = await db.execute(`
        SELECT DISTINCT 
          pv.color_id,
          c.name as color_name,
          c.hex_code,
          SUM(pv.stock) as total_stock,
          AVG(pv.price_override) as avg_price_override
        FROM product_variants pv
        LEFT JOIN colors c ON pv.color_id = c.id
        WHERE pv.product_id = ?
        GROUP BY pv.color_id, c.name, c.hex_code
      `, [product.id]);

      for (const color of colors as any[]) {
        // Create color variant
        const variantName = `${product.name} - ${color.color_name}`;
        const variantSku = `${product.id}-${color.color_id}`;
        
        const [variantResult] = await db.execute(`
          INSERT INTO product_color_variants 
          (product_id, color_id, variant_name, variant_sku, price, stock_total, active)
          VALUES (?, ?, ?, ?, ?, ?, true)
        `, [
          product.id,
          color.color_id,
          variantName,
          variantSku,
          color.avg_price_override,
          color.total_stock
        ]);

        const colorVariantId = (variantResult as any).insertId;

        // Get sizes and stock for this product-color combination
        const [sizeData] = await db.execute(`
          SELECT 
            pv.size_id,
            pv.stock
          FROM product_variants pv
          WHERE pv.product_id = ? AND pv.color_id = ?
        `, [product.id, color.color_id]);

        // Insert size stock data
        for (const sizeStock of sizeData as any[]) {
          await db.execute(`
            INSERT INTO product_variant_sizes 
            (color_variant_id, size_id, stock)
            VALUES (?, ?, ?)
          `, [colorVariantId, sizeStock.size_id, sizeStock.stock]);
        }
      }
    }

    const [variantCount] = await db.execute("SELECT COUNT(*) as count FROM product_color_variants");
    const [sizeCount] = await db.execute("SELECT COUNT(*) as count FROM product_variant_sizes");
    
    console.log(`✅ Migrated ${(variantCount as any)[0].count} color variants`);
    console.log(`✅ Migrated ${(sizeCount as any)[0].count} size stock entries`);

  } catch (error) {
    console.error("❌ Error creating color variants table:", error);
    throw error;
  }
}
