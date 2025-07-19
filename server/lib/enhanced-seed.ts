import db from "./db";

export async function enhanceDatabase() {
  try {
    console.log("Enhancing database schema...");

    // Add new columns to products table
    await db.execute(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS photo LONGTEXT,
      ADD COLUMN IF NOT EXISTS suggested_price DECIMAL(10,2),
      ADD COLUMN IF NOT EXISTS stock INT DEFAULT 0
    `);

    // Create product_sizes junction table (many-to-many relationship)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS product_sizes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        size_id INT NOT NULL,
        stock INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (size_id) REFERENCES sizes(id) ON DELETE CASCADE,
        UNIQUE KEY unique_product_size (product_id, size_id)
      )
    `);

    // Create product_colors junction table (many-to-many relationship)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS product_colors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        color_id INT NOT NULL,
        stock INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (color_id) REFERENCES colors(id) ON DELETE CASCADE,
        UNIQUE KEY unique_product_color (product_id, color_id)
      )
    `);

    // Create product_variants table (combination of size, color, and stock)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS product_variants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        size_id INT NOT NULL,
        color_id INT NOT NULL,
        stock INT DEFAULT 0,
        price_override DECIMAL(10,2) NULL,
        sku_variant VARCHAR(100) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (size_id) REFERENCES sizes(id) ON DELETE CASCADE,
        FOREIGN KEY (color_id) REFERENCES colors(id) ON DELETE CASCADE,
        UNIQUE KEY unique_product_variant (product_id, size_id, color_id)
      )
    `);

    // Create product_grades junction table (many-to-many relationship)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS product_grades (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        grade_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (grade_id) REFERENCES grade_vendida(id) ON DELETE CASCADE,
        UNIQUE KEY unique_product_grade (product_id, grade_id)
      )
    `);

    console.log("Database schema enhanced successfully!");

    // Add sample data for enhanced features
    await addSampleEnhancedData();

    return true;
  } catch (error) {
    console.error("Error enhancing database:", error);
    throw error;
  }
}

async function addSampleEnhancedData() {
  try {
    // Update existing products with new fields
    const samplePhoto =
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y0ZjRmNCIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTRweCIgZmlsbD0iIzk5OTk5OSI+Rm90byBkbyBQcm9kdXRvPC90ZXh0Pgo8L3N2Zz4=";

    // Update products with photos and suggested prices
    const products = [
      { id: 1, suggested_price: 180.0, stock: 50 },
      { id: 2, suggested_price: 210.0, stock: 30 },
      { id: 3, suggested_price: 190.0, stock: 25 },
      { id: 4, suggested_price: 250.0, stock: 40 },
      { id: 5, suggested_price: 650.0, stock: 15 },
      { id: 6, suggested_price: 150.0, stock: 60 },
      { id: 7, suggested_price: 890.0, stock: 8 },
      { id: 8, suggested_price: 180.0, stock: 35 },
      { id: 9, suggested_price: 320.0, stock: 20 },
      { id: 10, suggested_price: 450.0, stock: 12 },
    ];

    for (const product of products) {
      await db.execute(
        `UPDATE products SET photo = ?, suggested_price = ?, stock = ? WHERE id = ?`,
        [samplePhoto, product.suggested_price, product.stock, product.id],
      );
    }

    // Add product variants (size + color combinations with stock)
    const variants = [
      // Havaianas Brasil (product_id: 1) - available in multiple sizes and colors
      { product_id: 1, size_id: 5, color_id: 1, stock: 10 }, // 36 Preto
      { product_id: 1, size_id: 5, color_id: 2, stock: 8 }, // 36 Branco
      { product_id: 1, size_id: 6, color_id: 1, stock: 12 }, // 37 Preto
      { product_id: 1, size_id: 6, color_id: 2, stock: 10 }, // 37 Branco
      { product_id: 1, size_id: 7, color_id: 1, stock: 15 }, // 38 Preto
      { product_id: 1, size_id: 7, color_id: 2, stock: 12 }, // 38 Branco
      { product_id: 1, size_id: 8, color_id: 1, stock: 18 }, // 39 Preto
      { product_id: 1, size_id: 8, color_id: 2, stock: 15 }, // 39 Branco
      { product_id: 1, size_id: 9, color_id: 1, stock: 20 }, // 40 Preto
      { product_id: 1, size_id: 9, color_id: 2, stock: 18 }, // 40 Branco

      // Havaianas Slim (product_id: 2) - feminine colors
      { product_id: 2, size_id: 3, color_id: 5, stock: 5 }, // 34 Rosa
      { product_id: 2, size_id: 4, color_id: 5, stock: 8 }, // 35 Rosa
      { product_id: 2, size_id: 5, color_id: 5, stock: 10 }, // 36 Rosa
      { product_id: 2, size_id: 5, color_id: 2, stock: 8 }, // 36 Branco
      { product_id: 2, size_id: 6, color_id: 5, stock: 12 }, // 37 Rosa
      { product_id: 2, size_id: 6, color_id: 2, stock: 10 }, // 37 Branco
      { product_id: 2, size_id: 7, color_id: 5, stock: 8 }, // 38 Rosa
      { product_id: 2, size_id: 7, color_id: 2, stock: 6 }, // 38 Branco

      // Adidas Adilette (product_id: 7) - sport colors
      { product_id: 7, size_id: 7, color_id: 1, stock: 3 }, // 38 Preto
      { product_id: 7, size_id: 8, color_id: 1, stock: 4 }, // 39 Preto
      { product_id: 7, size_id: 9, color_id: 1, stock: 5 }, // 40 Preto
      { product_id: 7, size_id: 10, color_id: 1, stock: 4 }, // 41 Preto
      { product_id: 7, size_id: 11, color_id: 1, stock: 3 }, // 42 Preto
      { product_id: 7, size_id: 9, color_id: 2, stock: 2 }, // 40 Branco
      { product_id: 7, size_id: 10, color_id: 2, stock: 2 }, // 41 Branco

      // Havaianas Kids (product_id: 6) - colorful variants
      { product_id: 6, size_id: 1, color_id: 4, stock: 8 }, // 32 Vermelho
      { product_id: 6, size_id: 1, color_id: 7, stock: 6 }, // 32 Amarelo
      { product_id: 6, size_id: 2, color_id: 6, stock: 10 }, // 33 Verde
      { product_id: 6, size_id: 2, color_id: 5, stock: 8 }, // 33 Rosa
      { product_id: 6, size_id: 3, color_id: 3, stock: 12 }, // 34 Azul Marinho
      { product_id: 6, size_id: 3, color_id: 4, stock: 10 }, // 34 Vermelho
      { product_id: 6, size_id: 4, color_id: 7, stock: 8 }, // 35 Amarelo
      { product_id: 6, size_id: 5, color_id: 6, stock: 6 }, // 36 Verde
    ];

    for (const variant of variants) {
      await db.execute(
        `INSERT IGNORE INTO product_variants (product_id, size_id, color_id, stock) VALUES (?, ?, ?, ?)`,
        [variant.product_id, variant.size_id, variant.color_id, variant.stock],
      );
    }

    console.log("Sample enhanced data added successfully!");
  } catch (error) {
    console.error("Error adding sample enhanced data:", error);
  }
}
