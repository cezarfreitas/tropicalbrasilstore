import db from "../lib/db";

async function checkImageStorage() {
  try {
    console.log("🔍 Verificando armazenamento de imagens no banco...");

    // Check product_color_variants table
    console.log("\n📋 TABELA: product_color_variants");
    const [colorVariants] = await db.execute(`
      SELECT 
        pcv.id,
        p.name as product_name,
        c.name as color_name,
        pcv.image_url,
        pcv.variant_name,
        pcv.variant_sku
      FROM product_color_variants pcv
      LEFT JOIN products p ON pcv.product_id = p.id
      LEFT JOIN colors c ON pcv.color_id = c.id
      ORDER BY pcv.id DESC
      LIMIT 10
    `);
    
    if ((colorVariants as any[]).length > 0) {
      console.table(colorVariants);
    } else {
      console.log("❌ Nenhuma variante de cor encontrada");
    }

    // Check product_variants table
    console.log("\n📋 TABELA: product_variants");
    const [variants] = await db.execute(`
      SELECT 
        pv.id,
        p.name as product_name,
        c.name as color_name,
        s.size,
        pv.image_url,
        pv.stock
      FROM product_variants pv
      LEFT JOIN products p ON pv.product_id = p.id
      LEFT JOIN colors c ON pv.color_id = c.id
      LEFT JOIN sizes s ON pv.size_id = s.id
      WHERE p.name LIKE '%Chinelo ABC%'
      ORDER BY pv.id DESC
    `);

    if ((variants as any[]).length > 0) {
      console.table(variants);
    } else {
      console.log("❌ Nenhuma variante encontrada para Chinelo ABC");
    }

    // Check products table
    console.log("\n📋 TABELA: products");
    const [products] = await db.execute(`
      SELECT 
        id,
        name,
        sku,
        photo,
        active,
        stock_type
      FROM products 
      WHERE name LIKE '%Chinelo ABC%'
      ORDER BY id DESC
    `);

    if ((products as any[]).length > 0) {
      console.table(products);
    } else {
      console.log("❌ Nenhum produto Chinelo ABC encontrado");
    }

    // Check specific image URLs
    console.log("\n🔍 Verificando URLs de imagem específicas...");
    const [imageUrls] = await db.execute(`
      SELECT DISTINCT image_url 
      FROM product_variants 
      WHERE image_url IS NOT NULL AND image_url != ''
      UNION
      SELECT DISTINCT image_url 
      FROM product_color_variants 
      WHERE image_url IS NOT NULL AND image_url != ''
      UNION
      SELECT DISTINCT photo as image_url
      FROM products 
      WHERE photo IS NOT NULL AND photo != ''
    `);

    console.log("📸 URLs de imagem encontradas:");
    (imageUrls as any[]).forEach((row, index) => {
      console.log(`${index + 1}. ${row.image_url}`);
    });

  } catch (error) {
    console.error("❌ Erro:", error);
    throw error;
  }
}

// Execute if run directly
checkImageStorage()
  .then(() => {
    console.log("\n🎉 Verificação concluída!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Falha na verificação:", error);
    process.exit(1);
  });
