import db from "./db";

export async function seedDatabase() {
  try {
    console.log("Starting database seeding...");

    // Clear existing data
    await db.execute("SET FOREIGN_KEY_CHECKS = 0");
    await db.execute("DROP TABLE IF EXISTS grade_items");
    await db.execute("DROP TABLE IF EXISTS grade_vendida");
    await db.execute("DROP TABLE IF EXISTS products");
    await db.execute("DROP TABLE IF EXISTS categories");
    await db.execute("DROP TABLE IF EXISTS sizes");
    await db.execute("DROP TABLE IF EXISTS colors");
    await db.execute("SET FOREIGN_KEY_CHECKS = 1");

    // Create categories table
    await db.execute(`
      CREATE TABLE categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create sizes table
    await db.execute(`
      CREATE TABLE sizes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        size VARCHAR(50) NOT NULL UNIQUE,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create colors table
    await db.execute(`
      CREATE TABLE colors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        hex_code VARCHAR(7),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create products table
    await db.execute(`
      CREATE TABLE products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category_id INT,
        base_price DECIMAL(10,2),
        sku VARCHAR(100) UNIQUE,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      )
    `);

    // Create grade_vendida table
    await db.execute(`
      CREATE TABLE grade_vendida (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        total_price DECIMAL(10,2),
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create grade_items table
    await db.execute(`
      CREATE TABLE grade_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        grade_id INT NOT NULL,
        product_id INT NOT NULL,
        size_id INT NOT NULL,
        color_id INT NOT NULL,
        quantity INT NOT NULL,
        FOREIGN KEY (grade_id) REFERENCES grade_vendida(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (size_id) REFERENCES sizes(id) ON DELETE CASCADE,
        FOREIGN KEY (color_id) REFERENCES colors(id) ON DELETE CASCADE
      )
    `);

    // Insert categories
    const categories = [
      {
        name: "Chinelos Masculinos",
        description: "Chinelos e sandálias para homens",
      },
      {
        name: "Chinelos Femininos",
        description: "Chinelos e sandálias para mulheres",
      },
      { name: "Chinelos Infantis", description: "Chinelos para crianças" },
      {
        name: "Sandálias Esportivas",
        description: "Sandálias para atividades esportivas",
      },
      {
        name: "Chinelos de Borracha",
        description: "Chinelos resistentes de borracha",
      },
    ];

    for (const category of categories) {
      await db.execute(
        "INSERT INTO categories (name, description) VALUES (?, ?)",
        [category.name, category.description],
      );
    }

    // Insert sizes
    const sizes = [
      { size: "32", display_order: 1 },
      { size: "33", display_order: 2 },
      { size: "34", display_order: 3 },
      { size: "35", display_order: 4 },
      { size: "36", display_order: 5 },
      { size: "37", display_order: 6 },
      { size: "38", display_order: 7 },
      { size: "39", display_order: 8 },
      { size: "40", display_order: 9 },
      { size: "41", display_order: 10 },
      { size: "42", display_order: 11 },
      { size: "43", display_order: 12 },
      { size: "44", display_order: 13 },
    ];

    for (const size of sizes) {
      await db.execute(
        "INSERT INTO sizes (size, display_order) VALUES (?, ?)",
        [size.size, size.display_order],
      );
    }

    // Insert colors
    const colors = [
      { name: "Preto", hex_code: "#000000" },
      { name: "Branco", hex_code: "#FFFFFF" },
      { name: "Azul Marinho", hex_code: "#1B263B" },
      { name: "Vermelho", hex_code: "#E63946" },
      { name: "Rosa", hex_code: "#F72585" },
      { name: "Verde", hex_code: "#2D6A4F" },
      { name: "Amarelo", hex_code: "#F77F00" },
      { name: "Marrom", hex_code: "#8B4513" },
      { name: "Cinza", hex_code: "#6C757D" },
      { name: "Azul Claro", hex_code: "#61A5C2" },
    ];

    for (const color of colors) {
      await db.execute("INSERT INTO colors (name, hex_code) VALUES (?, ?)", [
        color.name,
        color.hex_code,
      ]);
    }

    // Insert products
    const products = [
      {
        name: "Havaianas Brasil",
        description: "Chinelo icônico do Brasil",
        category_id: 1,
        base_price: 25.9,
        sku: "HAV001",
      },
      {
        name: "Havaianas Slim",
        description: "Chinelo feminino slim",
        category_id: 2,
        base_price: 29.9,
        sku: "HAV002",
      },
      {
        name: "Ipanema Grendene",
        description: "Sandália urbana confortável",
        category_id: 2,
        base_price: 32.5,
        sku: "IPA001",
      },
      {
        name: "Rider Energy",
        description: "Chinelo masculino esportivo",
        category_id: 1,
        base_price: 39.9,
        sku: "RID001",
      },
      {
        name: "Melissa Beach Slide",
        description: "Sandália feminina de design",
        category_id: 2,
        base_price: 89.9,
        sku: "MEL001",
      },
      {
        name: "Havaianas Kids",
        description: "Chinelo infantil colorido",
        category_id: 3,
        base_price: 19.9,
        sku: "HAV003",
      },
      {
        name: "Adidas Adilette",
        description: "Sandália esportiva premium",
        category_id: 4,
        base_price: 149.9,
        sku: "ADI001",
      },
      {
        name: "Kenner Acqua",
        description: "Chinelo de borracha resistente",
        category_id: 5,
        base_price: 27.9,
        sku: "KEN001",
      },
      {
        name: "Grendene Zaxy",
        description: "Sandália fashion feminina",
        category_id: 2,
        base_price: 45.9,
        sku: "ZAX001",
      },
      {
        name: "Oakley Operative",
        description: "Chinelo masculino urbano",
        category_id: 1,
        base_price: 69.9,
        sku: "OAK001",
      },
    ];

    for (const product of products) {
      await db.execute(
        "INSERT INTO products (name, description, category_id, base_price, sku) VALUES (?, ?, ?, ?, ?)",
        [
          product.name,
          product.description,
          product.category_id,
          product.base_price,
          product.sku,
        ],
      );
    }

    // Insert grade vendida (kits)
    const grades = [
      {
        name: "Grade Básica Masculina",
        description: "Kit básico de chinelos masculinos - tamanhos 38-42",
        total_price: 180.0,
      },
      {
        name: "Grade Feminina Premium",
        description: "Kit premium feminino - tamanhos 34-38",
        total_price: 220.0,
      },
      {
        name: "Grade Infantil Colorida",
        description: "Kit infantil com cores variadas - tamanhos 32-36",
        total_price: 120.0,
      },
    ];

    for (const grade of grades) {
      await db.execute(
        "INSERT INTO grade_vendida (name, description, total_price) VALUES (?, ?, ?)",
        [grade.name, grade.description, grade.total_price],
      );
    }

    // Insert grade items
    const gradeItems = [
      // Grade Básica Masculina (grade_id: 1)
      { grade_id: 1, product_id: 1, size_id: 7, color_id: 1, quantity: 4 }, // Havaianas Brasil 38 Preto - 4 unidades
      { grade_id: 1, product_id: 1, size_id: 8, color_id: 1, quantity: 6 }, // Havaianas Brasil 39 Preto - 6 unidades
      { grade_id: 1, product_id: 1, size_id: 9, color_id: 1, quantity: 8 }, // Havaianas Brasil 40 Preto - 8 unidades
      { grade_id: 1, product_id: 1, size_id: 10, color_id: 1, quantity: 6 }, // Havaianas Brasil 41 Preto - 6 unidades
      { grade_id: 1, product_id: 1, size_id: 11, color_id: 1, quantity: 4 }, // Havaianas Brasil 42 Preto - 4 unidades

      // Grade Feminina Premium (grade_id: 2)
      { grade_id: 2, product_id: 2, size_id: 3, color_id: 5, quantity: 3 }, // Havaianas Slim 34 Rosa - 3 unidades
      { grade_id: 2, product_id: 2, size_id: 4, color_id: 5, quantity: 5 }, // Havaianas Slim 35 Rosa - 5 unidades
      { grade_id: 2, product_id: 2, size_id: 5, color_id: 5, quantity: 6 }, // Havaianas Slim 36 Rosa - 6 unidades
      { grade_id: 2, product_id: 2, size_id: 6, color_id: 5, quantity: 5 }, // Havaianas Slim 37 Rosa - 5 unidades
      { grade_id: 2, product_id: 2, size_id: 7, color_id: 5, quantity: 3 }, // Havaianas Slim 38 Rosa - 3 unidades

      // Grade Infantil Colorida (grade_id: 3)
      { grade_id: 3, product_id: 6, size_id: 1, color_id: 4, quantity: 2 }, // Havaianas Kids 32 Vermelho - 2 unidades
      { grade_id: 3, product_id: 6, size_id: 2, color_id: 7, quantity: 3 }, // Havaianas Kids 33 Amarelo - 3 unidades
      { grade_id: 3, product_id: 6, size_id: 3, color_id: 6, quantity: 4 }, // Havaianas Kids 34 Verde - 4 unidades
      { grade_id: 3, product_id: 6, size_id: 4, color_id: 3, quantity: 3 }, // Havaianas Kids 35 Azul Marinho - 3 unidades
      { grade_id: 3, product_id: 6, size_id: 5, color_id: 5, quantity: 2 }, // Havaianas Kids 36 Rosa - 2 unidades
    ];

    for (const item of gradeItems) {
      await db.execute(
        "INSERT INTO grade_items (grade_id, product_id, size_id, color_id, quantity) VALUES (?, ?, ?, ?, ?)",
        [
          item.grade_id,
          item.product_id,
          item.size_id,
          item.color_id,
          item.quantity,
        ],
      );
    }

    console.log("Database seeded successfully!");
    console.log("Created:");
    console.log("- 5 categories");
    console.log("- 13 sizes (32-44)");
    console.log("- 10 colors");
    console.log("- 10 products");
    console.log("- 3 grade vendida (kits)");
    console.log("- 15 grade items");

    return true;
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}
