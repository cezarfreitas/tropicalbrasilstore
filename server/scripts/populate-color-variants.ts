import db from "../lib/db";

async function populateColorVariants() {
  try {
    console.log("🔄 Populando tabela product_color_variants...");

    // First, clear existing data to start fresh
    await db.execute("DELETE FROM product_variant_sizes");
    await db.execute("DELETE FROM product_color_variants");
    console.log("🧹 Limpando dados antigos...");

    // Get products that have variants
    const [products] = await db.execute(`
      SELECT DISTINCT p.id, p.name, p.sku 
      FROM products p 
      JOIN product_variants pv ON p.id = pv.product_id
      ORDER BY p.id
    `);

    if ((products as any[]).length === 0) {
      console.log("❌ Nenhum produto com variantes encontrado");
      return;
    }

    console.log(`📦 Processando ${(products as any[]).length} produtos...`);

    for (const product of products as any[]) {
      console.log(`\n🔄 Processando produto: ${product.name} (ID: ${product.id})`);

      // Get unique colors for this product
      const [colors] = await db.execute(`
        SELECT DISTINCT 
          pv.color_id,
          c.name as color_name,
          c.hex_code,
          COUNT(pv.id) as variant_count,
          SUM(pv.stock) as total_stock,
          AVG(CASE WHEN pv.price_override IS NOT NULL THEN pv.price_override END) as avg_price_override,
          MIN(pv.image_url) as sample_image_url
        FROM product_variants pv
        LEFT JOIN colors c ON pv.color_id = c.id
        WHERE pv.product_id = ?
        GROUP BY pv.color_id, c.name, c.hex_code
      `, [product.id]);

      console.log(`   🎨 Cores encontradas: ${(colors as any[]).length}`);

      for (const color of colors as any[]) {
        console.log(`   📝 Criando variante cor: ${color.color_name}`);

        // Create color variant entry
        const variantName = `${product.name} - ${color.color_name}`;
        const variantSku = product.sku ? `${product.sku}-${color.color_name.toUpperCase()}` : null;
        
        try {
          const [variantResult] = await db.execute(`
            INSERT INTO product_color_variants 
            (product_id, color_id, variant_name, variant_sku, price, sale_price, image_url, stock_total, active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, true)
            ON DUPLICATE KEY UPDATE
            variant_name = VALUES(variant_name),
            variant_sku = VALUES(variant_sku),
            price = VALUES(price),
            image_url = VALUES(image_url),
            stock_total = VALUES(stock_total)
          `, [
            product.id,
            color.color_id,
            variantName,
            variantSku,
            color.avg_price_override,
            null, // sale_price
            color.sample_image_url,
            color.total_stock
          ]);

          const colorVariantId = (variantResult as any).insertId || null;

          if (colorVariantId) {
            console.log(`     ✅ Variante criada com ID: ${colorVariantId}`);

            // Get sizes and stock for this product-color combination
            const [sizeData] = await db.execute(`
              SELECT 
                pv.size_id,
                s.size,
                pv.stock
              FROM product_variants pv
              LEFT JOIN sizes s ON pv.size_id = s.id
              WHERE pv.product_id = ? AND pv.color_id = ?
              ORDER BY s.size
            `, [product.id, color.color_id]);

            console.log(`     📏 Tamanhos encontrados: ${(sizeData as any[]).length}`);

            // Insert size stock data
            for (const sizeStock of sizeData as any[]) {
              await db.execute(`
                INSERT INTO product_variant_sizes 
                (color_variant_id, size_id, stock)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE
                stock = VALUES(stock)
              `, [colorVariantId, sizeStock.size_id, sizeStock.stock]);
              
              console.log(`       🔸 Tamanho ${sizeStock.size}: ${sizeStock.stock} unidades`);
            }
          }

        } catch (error) {
          console.error(`     ❌ Erro ao criar variante cor ${color.color_name}:`, error.message);
        }
      }
    }

    // Show final statistics
    const [finalVariantCount] = await db.execute("SELECT COUNT(*) as count FROM product_color_variants");
    const [finalSizeCount] = await db.execute("SELECT COUNT(*) as count FROM product_variant_sizes");
    
    console.log(`\n✅ Migração concluída!`);
    console.log(`   🎨 Variantes de cor criadas: ${(finalVariantCount as any[])[0].count}`);
    console.log(`   📏 Entradas de tamanho criadas: ${(finalSizeCount as any[])[0].count}`);

    // Show some examples
    console.log("\n📋 Exemplos de variantes criadas:");
    const [examples] = await db.execute(`
      SELECT 
        pcv.id,
        p.name as product_name,
        c.name as color_name,
        pcv.variant_name,
        pcv.variant_sku,
        pcv.stock_total
      FROM product_color_variants pcv
      LEFT JOIN products p ON pcv.product_id = p.id
      LEFT JOIN colors c ON pcv.color_id = c.id
      ORDER BY pcv.id
      LIMIT 5
    `);
    
    console.table(examples);

  } catch (error) {
    console.error("❌ Erro na migração:", error);
    throw error;
  }
}

// Execute if run directly
populateColorVariants()
  .then(() => {
    console.log("🎉 Script executado com sucesso!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Falha no script:", error);
    process.exit(1);
  });

export { populateColorVariants };
