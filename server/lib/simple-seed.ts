import db from "./db";

export async function addSampleProducts() {
  try {
    console.log("Adding sample products...");

    // Get existing data
    const [categoryRows] = await db.execute(
      "SELECT id, name FROM categories ORDER BY id",
    );
    const [colorRows] = await db.execute(
      "SELECT id, name FROM colors ORDER BY id",
    );
    const [sizeRows] = await db.execute(
      "SELECT id, size FROM sizes ORDER BY display_order",
    );

    const categories = categoryRows as any[];
    const colors = colorRows as any[];
    const sizes = sizeRows as any[];

    console.log(
      `Found ${categories.length} categories, ${colors.length} colors, ${sizes.length} sizes`,
    );

    if (categories.length === 0 || colors.length === 0 || sizes.length === 0) {
      console.log(
        "Missing basic data - categories, colors or sizes. Please run the basic seed first.",
      );
      return false;
    }

    // Sample product names
    const productNames = [
      "Chinelo Havaianas Top",
      "Sandália Ipanema Wave",
      "Chinelo Rider Energy",
      "Havaianas Brasil Logo",
      "Ipanema Anatomic",
      "Melissa Beach Slide",
      "Grendene Zaxy Fresh",
      "Chinelo Nike Benassi",
      "Adidas Adilette Comfort",
      "Oakley Ellipse Flip",
      "Quiksilver Molokai",
      "Billabong All Day",
      "Volcom Rocker 2",
      "Reef Fanning",
      "Hurley Phantom",
      "Roxy Sandy",
      "Havaianas Slim",
      "Ipanema Gisele Bundchen",
      "Rider Dunas Evolution",
      "Melissa Harmonic",
      "Chinelo Ortopédico Confort",
      "Sandália Papete Trekking",
      "Flip-Flop Basic",
      "Chinelo Esportivo Pro",
      "Havaianas Kids",
      "Ipanema Fashion",
      "Rider Strike",
      "Melissa Summer",
      "Grendene Style",
      "Chinelo Premium Leather",
      "Sandália Feminina Delicada",
      "Chinelo Masculino Robusto",
      "Flip-Flop Tropical",
      "Havaianas Flash Urban",
      "Ipanema Bossa Soft",
      "Rider Cape",
      "Melissa Beach Bag",
      "Chinelo Ortho Saúde",
      "Sandália Infantil Colorida",
      "Flip-Flop Minimalista",
      "Havaianas You Metallic",
      "Ipanema Class Glam",
      "Rider R1",
      "Melissa Possession",
      "Chinelo Memory Foam",
      "Sandália Plataforma",
      "Flip-Flop Ecológico",
      "Havaianas Urban Craft",
      "Ipanema Nectar",
      "Rider Infinity",
    ];

    // Sample images
    const sampleImages = [
      "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1582588678413-dbf45f4823e9?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1560228834-9b1b13ba8997?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1594736797933-d0f06ba42c25?w=400&h=400&fit=crop",
    ];

    // Check how many products already exist
    const [existingProducts] = await db.execute(
      "SELECT COUNT(*) as count FROM products",
    );
    const currentCount = (existingProducts as any)[0].count;

    console.log(`Currently ${currentCount} products in database`);

    // Add products to reach 100 total
    const targetCount = 100;
    const toAdd = Math.max(0, targetCount - currentCount);

    if (toAdd === 0) {
      console.log("Already have 100+ products!");
      return true;
    }

    console.log(
      `Adding ${toAdd} products to reach target of ${targetCount}...`,
    );

    for (let i = 0; i < toAdd; i++) {
      const nameIndex = i % productNames.length;
      const productName = `${productNames[nameIndex]} #${String(currentCount + i + 1).padStart(3, "0")}`;
      const description = `${productName} - Confortável, durável e estiloso. Ideal para uso diário.`;
      const categoryId =
        categories[Math.floor(Math.random() * categories.length)].id;
      const basePrice = Math.floor(Math.random() * 50) + 15; // R$ 15-65
      const suggestedPrice =
        Math.floor(basePrice * 1.5) + Math.floor(Math.random() * 15);
      const imageUrl =
        sampleImages[Math.floor(Math.random() * sampleImages.length)];

      // Insert product
      const [productResult] = await db.execute(
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

      const productId = (productResult as any).insertId;

      // Add 2-4 random colors for this product
      const numColors = Math.floor(Math.random() * 3) + 2; // 2-4 colors
      const selectedColors = colors
        .sort(() => 0.5 - Math.random())
        .slice(0, numColors);

      for (const color of selectedColors) {
        // Add variants for common sizes (36-42)
        const commonSizeIds = sizes
          .filter((s) => parseInt(s.size) >= 36 && parseInt(s.size) <= 42)
          .map((s) => s.id);

        for (const sizeId of commonSizeIds) {
          const stock = Math.floor(Math.random() * 50) + 10; // 10-60 stock

          await db.execute(
            `INSERT INTO product_variants (product_id, size_id, color_id, stock) 
             VALUES (?, ?, ?, ?)`,
            [productId, sizeId, color.id, stock],
          );
        }
      }

      if ((i + 1) % 10 === 0) {
        console.log(`Added ${i + 1}/${toAdd} products...`);
      }
    }

    console.log(`✅ Successfully added ${toAdd} products!`);

    // Show final count
    const [finalCount] = await db.execute(
      "SELECT COUNT(*) as count FROM products",
    );
    console.log(
      `✅ Total products in database: ${(finalCount as any)[0].count}`,
    );

    return true;
  } catch (error) {
    console.error("❌ Error adding sample products:", error);
    throw error;
  }
}
