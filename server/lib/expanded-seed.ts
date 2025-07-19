import db from "./db";

export async function seedExpandedDatabase() {
  try {
    console.log("Starting expanded database seeding with 100 products...");

    // Check existing data counts
    const [existingProducts] = await db.execute(
      "SELECT COUNT(*) as count FROM products",
    );
    const [existingCategories] = await db.execute(
      "SELECT COUNT(*) as count FROM categories",
    );
    const [existingColors] = await db.execute(
      "SELECT COUNT(*) as count FROM colors",
    );

    const productCount = (existingProducts as any)[0].count;
    const categoryCount = (existingCategories as any)[0].count;
    const colorCount = (existingColors as any)[0].count;

    console.log(
      `Found ${productCount} existing products, ${categoryCount} categories, ${colorCount} colors`,
    );

    // Sample categories
    const categories = [
      {
        name: "Chinelos Masculinos",
        description: "Chinelos confortáveis para homens",
      },
      {
        name: "Chinelos Femininos",
        description: "Chinelos elegantes para mulheres",
      },
      {
        name: "Chinelos Infantis",
        description: "Chinelos divertidos para crianças",
      },
      {
        name: "Sandálias Masculinas",
        description: "Sandálias robustas para homens",
      },
      {
        name: "Sandálias Femininas",
        description: "Sandálias delicadas para mulheres",
      },
      { name: "Flip-Flops", description: "Chinelos simples e práticos" },
      {
        name: "Chinelos Ortopédicos",
        description: "Chinelos com suporte especial",
      },
      { name: "Chinelos de Praia", description: "Resistentes à água e areia" },
      { name: "Chinelos Esportivos", description: "Para atividades físicas" },
      {
        name: "Chinelos Premium",
        description: "Linha premium com materiais nobres",
      },
    ];

    // Add categories only if they don't exist
    for (const category of categories) {
      const [existing] = await db.execute(
        "SELECT id FROM categories WHERE name = ?",
        [category.name],
      );

      if ((existing as any[]).length === 0) {
        await db.execute(
          "INSERT INTO categories (name, description) VALUES (?, ?)",
          [category.name, category.description],
        );
      }
    }

    // Sample colors with hex codes
    const colors = [
      { name: "Preto", hex_code: "#000000" },
      { name: "Branco", hex_code: "#FFFFFF" },
      { name: "Azul Marinho", hex_code: "#001f3f" },
      { name: "Azul Royal", hex_code: "#0074CC" },
      { name: "Vermelho", hex_code: "#FF4136" },
      { name: "Verde", hex_code: "#2ECC40" },
      { name: "Amarelo", hex_code: "#FFDC00" },
      { name: "Rosa", hex_code: "#FF69B4" },
      { name: "Roxo", hex_code: "#8A2BE2" },
      { name: "Laranja", hex_code: "#FF851B" },
      { name: "Marrom", hex_code: "#8B4513" },
      { name: "Cinza", hex_code: "#808080" },
      { name: "Bege", hex_code: "#F5F5DC" },
      { name: "Dourado", hex_code: "#FFD700" },
      { name: "Prata", hex_code: "#C0C0C0" },
      { name: "Coral", hex_code: "#FF7F50" },
      { name: "Turquesa", hex_code: "#40E0D0" },
      { name: "Lima", hex_code: "#32CD32" },
      { name: "Magenta", hex_code: "#FF00FF" },
      { name: "Ciano", hex_code: "#00FFFF" },
    ];

    // Add colors only if they don't exist
    for (const color of colors) {
      const [existing] = await db.execute(
        "SELECT id FROM colors WHERE name = ?",
        [color.name],
      );

      if ((existing as any[]).length === 0) {
        await db.execute("INSERT INTO colors (name, hex_code) VALUES (?, ?)", [
          color.name,
          color.hex_code,
        ]);
      }
    }

    // Sample sizes
    const sizes = [
      { size: "33", display_order: 1 },
      { size: "34", display_order: 2 },
      { size: "35", display_order: 3 },
      { size: "36", display_order: 4 },
      { size: "37", display_order: 5 },
      { size: "38", display_order: 6 },
      { size: "39", display_order: 7 },
      { size: "40", display_order: 8 },
      { size: "41", display_order: 9 },
      { size: "42", display_order: 10 },
      { size: "43", display_order: 11 },
      { size: "44", display_order: 12 },
      { size: "45", display_order: 13 },
      { size: "46", display_order: 14 },
    ];

    // Add sizes only if they don't exist
    for (const size of sizes) {
      const [existing] = await db.execute(
        "SELECT id FROM sizes WHERE size = ?",
        [size.size],
      );

      if ((existing as any[]).length === 0) {
        await db.execute(
          "INSERT INTO sizes (size, display_order) VALUES (?, ?)",
          [size.size, size.display_order],
        );
      }
    }

    // Sample product names and descriptions
    const productTemplates = [
      {
        base: "Chinelo",
        variations: ["Clássico", "Comfort", "Sport", "Premium", "Basic"],
      },
      {
        base: "Sandália",
        variations: [
          "Elegante",
          "Casual",
          "Esportiva",
          "Ortopédica",
          "Fashion",
        ],
      },
      {
        base: "Havaianas",
        variations: ["Top", "Slim", "Brasil", "Flash", "Urban"],
      },
      {
        base: "Ipanema",
        variations: ["Classic", "Wave", "Fashion", "Anatomic", "Glam"],
      },
      {
        base: "Rider",
        variations: ["Energy", "Strike", "Smooth", "Cape", "Dunas"],
      },
      {
        base: "Grendene",
        variations: ["Comfort", "Style", "Beach", "City", "Trend"],
      },
      {
        base: "Melissa",
        variations: ["Beach", "Summer", "Classic", "Modern", "Chic"],
      },
      { base: "Zaxy", variations: ["Fresh", "Pop", "Zen", "Club", "Snap"] },
    ];

    // Sample images from Unsplash (flip-flops/sandals)
    const sampleImages = [
      "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1582588678413-dbf45f4823e9?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1560228834-9b1b13ba8997?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1594736797933-d0f06ba42c25?w=400&h=400&fit=crop",
    ];

    // Generate 100 products
    for (let i = 1; i <= 100; i++) {
      const template =
        productTemplates[Math.floor(Math.random() * productTemplates.length)];
      const variation =
        template.variations[
          Math.floor(Math.random() * template.variations.length)
        ];
      const categoryId = Math.floor(Math.random() * categories.length) + 1;
      const basePrice = Math.floor(Math.random() * 50) + 15; // R$ 15-65
      const suggestedPrice =
        Math.floor(basePrice * 1.5) + Math.floor(Math.random() * 20); // Markup
      const imageUrl =
        sampleImages[Math.floor(Math.random() * sampleImages.length)];

      const productName = `${template.base} ${variation} #${i.toString().padStart(3, "0")}`;
      const description = `${productName} - Confortável, durável e com design moderno. Ideal para uso diário.`;

      await db.execute(
        `INSERT INTO products (name, description, category_id, base_price, suggested_price, photo, active) 
         VALUES (?, ?, ?, ?, ?, ?, true)`,
        [
          productName,
          description,
          categoryId,
          basePrice,
          suggestedPrice,
          imageUrl,
        ],
      );

      // Create product variants (random colors and sizes)
      const numColors = Math.floor(Math.random() * 5) + 2; // 2-6 colors per product
      const availableColorIds = Array.from(
        { length: colors.length },
        (_, i) => i + 1,
      );
      const selectedColors = availableColorIds
        .sort(() => 0.5 - Math.random())
        .slice(0, numColors);

      for (const colorId of selectedColors) {
        // Each color has variants for sizes 36-42 (most common)
        const commonSizes = [4, 5, 6, 7, 8, 9, 10]; // IDs for sizes 36-42

        for (const sizeId of commonSizes) {
          const stock = Math.floor(Math.random() * 50) + 10; // 10-60 stock
          const priceOverride =
            Math.random() > 0.8
              ? basePrice + Math.floor(Math.random() * 10)
              : null;

          await db.execute(
            `INSERT INTO product_variants (product_id, size_id, color_id, stock, price_override) 
             VALUES (?, ?, ?, ?, ?)`,
            [i, sizeId, colorId, stock, priceOverride],
          );
        }
      }
    }

    // Create sample grades
    const gradeTemplates = [
      {
        name: "Grade Pequena",
        description: "12 pares sortidos",
        sizes: [
          { size_id: 4, quantity: 1 }, // 36
          { size_id: 5, quantity: 2 }, // 37
          { size_id: 6, quantity: 3 }, // 38
          { size_id: 7, quantity: 3 }, // 39
          { size_id: 8, quantity: 2 }, // 40
          { size_id: 9, quantity: 1 }, // 41
        ],
      },
      {
        name: "Grade Média",
        description: "24 pares sortidos",
        sizes: [
          { size_id: 4, quantity: 2 }, // 36
          { size_id: 5, quantity: 4 }, // 37
          { size_id: 6, quantity: 6 }, // 38
          { size_id: 7, quantity: 6 }, // 39
          { size_id: 8, quantity: 4 }, // 40
          { size_id: 9, quantity: 2 }, // 41
        ],
      },
      {
        name: "Grade Grande",
        description: "36 pares sortidos",
        sizes: [
          { size_id: 3, quantity: 2 }, // 35
          { size_id: 4, quantity: 4 }, // 36
          { size_id: 5, quantity: 6 }, // 37
          { size_id: 6, quantity: 8 }, // 38
          { size_id: 7, quantity: 8 }, // 39
          { size_id: 8, quantity: 6 }, // 40
          { size_id: 9, quantity: 2 }, // 41
        ],
      },
      {
        name: "Grade Família",
        description: "48 pares sortidos",
        sizes: [
          { size_id: 2, quantity: 2 }, // 34
          { size_id: 3, quantity: 4 }, // 35
          { size_id: 4, quantity: 6 }, // 36
          { size_id: 5, quantity: 8 }, // 37
          { size_id: 6, quantity: 10 }, // 38
          { size_id: 7, quantity: 10 }, // 39
          { size_id: 8, quantity: 6 }, // 40
          { size_id: 9, quantity: 2 }, // 41
        ],
      },
    ];

    for (const grade of gradeTemplates) {
      const [result] = await db.execute(
        "INSERT INTO grade_vendida (name, description, active) VALUES (?, ?, true)",
        [grade.name, grade.description],
      );

      const gradeId = (result as any).insertId;

      // Create grade templates
      for (const sizeConfig of grade.sizes) {
        await db.execute(
          "INSERT INTO grade_templates (grade_id, size_id, required_quantity) VALUES (?, ?, ?)",
          [gradeId, sizeConfig.size_id, sizeConfig.quantity],
        );
      }

      // Associate grades with random products and colors
      const numAssociations = Math.floor(Math.random() * 30) + 20; // 20-50 products per grade

      for (let j = 0; j < numAssociations; j++) {
        const productId = Math.floor(Math.random() * 100) + 1;
        const colorId = Math.floor(Math.random() * colors.length) + 1;

        // Check if this combination already exists
        const [existing] = await db.execute(
          "SELECT id FROM product_color_grades WHERE product_id = ? AND color_id = ? AND grade_id = ?",
          [productId, colorId, gradeId],
        );

        if ((existing as any[]).length === 0) {
          await db.execute(
            "INSERT INTO product_color_grades (product_id, color_id, grade_id) VALUES (?, ?, ?)",
            [productId, colorId, gradeId],
          );
        }
      }
    }

    console.log("✅ Expanded database seeding completed successfully!");
    console.log(`✅ Created ${categories.length} categories`);
    console.log(`✅ Created ${colors.length} colors`);
    console.log(`✅ Created ${sizes.length} sizes`);
    console.log(`✅ Created 100 products with variants`);
    console.log(`✅ Created ${gradeTemplates.length} grade templates`);

    return true;
  } catch (error) {
    console.error("❌ Error during expanded seeding:", error);
    throw error;
  }
}
