import db from "./db";

export async function resetAndSeedProducts() {
  try {
    console.log("🗑️ Clearing existing product data...");
    
    // Clear all product-related data in correct order (respecting foreign keys)
    await db.execute("DELETE FROM order_items");
    await db.execute("DELETE FROM product_variants");
    await db.execute("DELETE FROM products");
    
    console.log("✅ Product data cleared successfully");

    console.log("📦 Adding comprehensive product data...");

    // First, ensure we have comprehensive colors
    const colors = [
      { name: "Preto", hex_code: "#000000" },
      { name: "Branco", hex_code: "#FFFFFF" },
      { name: "Azul", hex_code: "#0066CC" },
      { name: "Vermelho", hex_code: "#FF0000" },
      { name: "Verde", hex_code: "#00AA00" },
      { name: "Amarelo", hex_code: "#FFDD00" },
      { name: "Rosa", hex_code: "#FF69B4" },
      { name: "Roxo", hex_code: "#8A2BE2" },
      { name: "Laranja", hex_code: "#FF8C00" },
      { name: "Cinza", hex_code: "#808080" },
      { name: "Marrom", hex_code: "#8B4513" },
      { name: "Dourado", hex_code: "#FFD700" },
      { name: "Prateado", hex_code: "#C0C0C0" },
      { name: "Turquesa", hex_code: "#40E0D0" },
      { name: "Coral", hex_code: "#FF7F50" }
    ];

    for (const color of colors) {
      try {
        await db.execute("INSERT IGNORE INTO colors (name, hex_code) VALUES (?, ?)", [
          color.name,
          color.hex_code,
        ]);
      } catch (error) {
        // Color might already exist, continue
      }
    }

    // Add comprehensive products
    const products = [
      {
        name: "Havaianas Brasil",
        description: "Chinelo clássico com as cores do Brasil",
        category_id: 1,
        base_price: 29.90,
        sku: "HAV001"
      },
      {
        name: "Havaianas Top",
        description: "O chinelo mais tradicional do Brasil",
        category_id: 1,
        base_price: 24.90,
        sku: "HAV002"
      },
      {
        name: "Havaianas Slim",
        description: "Chinelo feminino delicado e elegante",
        category_id: 2,
        base_price: 32.90,
        sku: "HAV003"
      },
      {
        name: "Ipanema Class Pop",
        description: "Sandália feminina colorida e moderna",
        category_id: 2,
        base_price: 35.90,
        sku: "IPA001"
      },
      {
        name: "Rider Strike",
        description: "Chinelo masculino esportivo resistente",
        category_id: 1,
        base_price: 39.90,
        sku: "RID001"
      },
      {
        name: "Melissa Beach Slide",
        description: "Sandália premium com design exclusivo",
        category_id: 2,
        base_price: 89.90,
        sku: "MEL001"
      },
      {
        name: "Havaianas Kids",
        description: "Chinelo especial para crianças",
        category_id: 3,
        base_price: 22.90,
        sku: "HAV004"
      },
      {
        name: "Nike Benassi",
        description: "Sandália esportiva premium da Nike",
        category_id: 4,
        base_price: 159.90,
        sku: "NIK001"
      },
      {
        name: "Kenner Acqua",
        description: "Chinelo de borracha profissional",
        category_id: 5,
        base_price: 31.90,
        sku: "KEN001"
      },
      {
        name: "Grendene Zaxy",
        description: "Sandália feminina com estampa floral",
        category_id: 2,
        base_price: 45.90,
        sku: "ZAX001"
      },
      {
        name: "Reef Fanning",
        description: "Chinelo com abridor de garrafa embutido",
        category_id: 4,
        base_price: 189.90,
        sku: "REE001"
      },
      {
        name: "Quiksilver Molokai",
        description: "Chinelo surf style masculino",
        category_id: 1,
        base_price: 79.90,
        sku: "QUI001"
      },
      {
        name: "Roxy Sandy",
        description: "Sandália feminina estilo praia",
        category_id: 2,
        base_price: 85.90,
        sku: "ROX001"
      },
      {
        name: "Adidas Adilette",
        description: "Sandália esportiva clássica da Adidas",
        category_id: 4,
        base_price: 139.90,
        sku: "ADI001"
      },
      {
        name: "Crocs Classic",
        description: "Sandália anatômica de material especial",
        category_id: 4,
        base_price: 199.90,
        sku: "CRO001"
      },
      {
        name: "Havaianas You Metallic",
        description: "Chinelo feminino com acabamento metalizado",
        category_id: 2,
        base_price: 42.90,
        sku: "HAV005"
      },
      {
        name: "Ipanema Gisele Bündchen",
        description: "Sandália assinada pela Gisele Bündchen",
        category_id: 2,
        base_price: 67.90,
        sku: "IPA002"
      },
      {
        name: "Rider Dunas",
        description: "Chinelo masculino anatômico premium",
        category_id: 1,
        base_price: 55.90,
        sku: "RID002"
      },
      {
        name: "Melissa Possession",
        description: "Sandália alta fashion feminina",
        category_id: 2,
        base_price: 129.90,
        sku: "MEL002"
      },
      {
        name: "Havaianas Urban Craft",
        description: "Chinelo masculino urbano diferenciado",
        category_id: 1,
        base_price: 49.90,
        sku: "HAV006"
      },
      {
        name: "Under Armour Ignite",
        description: "Sandália esportiva de alta performance",
        category_id: 4,
        base_price: 169.90,
        sku: "UAR001"
      },
      {
        name: "Puma Divecat",
        description: "Sandália esportiva urbana",
        category_id: 4,
        base_price: 119.90,
        sku: "PUM001"
      },
      {
        name: "Havaianas Flash Urban",
        description: "Chinelo premium com design moderno",
        category_id: 1,
        base_price: 59.90,
        sku: "HAV007"
      },
      {
        name: "Ipanema Nectar",
        description: "Sandália perfumada com essência floral",
        category_id: 2,
        base_price: 38.90,
        sku: "IPA003"
      },
      {
        name: "Oakley Operative",
        description: "Chinelo premium com tecnologia anti-derrapante",
        category_id: 1,
        base_price: 149.90,
        sku: "OAK001"
      }
    ];

    // Insert products and collect their IDs
    const productIds: number[] = [];
    for (const product of products) {
      const [result] = await db.execute(
        "INSERT INTO products (name, description, category_id, base_price, sku) VALUES (?, ?, ?, ?, ?)",
        [product.name, product.description, product.category_id, product.base_price, product.sku]
      );
      productIds.push((result as any).insertId);
    }

    console.log(`✅ Added ${products.length} products`);

    // Get all available sizes and colors
    const [sizesResult] = await db.execute("SELECT id FROM sizes ORDER BY display_order");
    const [colorsResult] = await db.execute("SELECT id FROM colors");
    
    const sizes = sizesResult as { id: number }[];
    const colorsData = colorsResult as { id: number }[];

    console.log(`📦 Creating variants for ${productIds.length} products with ${sizes.length} sizes and ${colorsData.length} colors...`);

    // Create comprehensive product variants with realistic stock distribution
    let variantCount = 0;
    for (const productId of productIds) {
      // Each product will have variants for 3-7 random sizes and 2-5 random colors
      const selectedSizes = sizes.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 5) + 3);
      const selectedColors = colorsData.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 4) + 2);

      for (const size of selectedSizes) {
        for (const color of selectedColors) {
          // Create realistic stock distribution:
          // 70% chance of good stock (20-80 units)
          // 20% chance of low stock (1-10 units)  
          // 10% chance of out of stock (0 units)
          let stock: number;
          const randomValue = Math.random();
          
          if (randomValue < 0.7) {
            stock = Math.floor(Math.random() * 61) + 20; // 20-80
          } else if (randomValue < 0.9) {
            stock = Math.floor(Math.random() * 10) + 1; // 1-10
          } else {
            stock = 0; // Out of stock
          }

          try {
            await db.execute(
              "INSERT INTO product_variants (product_id, size_id, color_id, stock) VALUES (?, ?, ?, ?)",
              [productId, size.id, color.id, stock]
            );
            variantCount++;
          } catch (error) {
            // Skip if variant combination already exists
            console.log(`Variant combination already exists for product ${productId}, size ${size.id}, color ${color.id}`);
          }
        }
      }
    }

    console.log(`✅ Created ${variantCount} product variants with realistic stock levels`);

    // Get final counts for summary
    const [finalProductCount] = await db.execute("SELECT COUNT(*) as count FROM products WHERE active = true");
    const [finalVariantCount] = await db.execute("SELECT COUNT(*) as count FROM product_variants");
    const [finalColorCount] = await db.execute("SELECT COUNT(*) as count FROM colors");
    const [finalSizeCount] = await db.execute("SELECT COUNT(*) as count FROM sizes");

    const productCountResult = (finalProductCount as any)[0].count;
    const variantCountResult = (finalVariantCount as any)[0].count;
    const colorCountResult = (finalColorCount as any)[0].count;
    const sizeCountResult = (finalSizeCount as any)[0].count;

    console.log("\n🎉 Database reset and seeding completed successfully!");
    console.log("📊 Summary:");
    console.log(`   - Products: ${productCountResult}`);
    console.log(`   - Product Variants: ${variantCountResult}`);
    console.log(`   - Colors Available: ${colorCountResult}`);
    console.log(`   - Sizes Available: ${sizeCountResult}`);
    console.log(`   - Average variants per product: ${Math.round(variantCountResult / productCountResult)}`);

    return {
      success: true,
      products: productCountResult,
      variants: variantCountResult,
      colors: colorCountResult,
      sizes: sizeCountResult
    };

  } catch (error) {
    console.error("❌ Error during product reset and seeding:", error);
    throw error;
  }
}
