import db from "../lib/db";

async function setupSizeStockExample() {
  try {
    console.log("⚙️ Configurando exemplo de produto com estoque por tamanho...");
    
    // Verificar se o produto Nike Air Max existe
    const [existingProduct] = await db.execute(`
      SELECT id, name, stock_type FROM products 
      WHERE name LIKE '%Nike%Air%Max%' 
      LIMIT 1
    `);
    
    let productId;
    
    if ((existingProduct as any[]).length > 0) {
      productId = (existingProduct as any[])[0].id;
      console.log(`✅ Produto Nike Air Max encontrado (ID: ${productId})`);
      
      // Garantir que está configurado como estoque por tamanho
      await db.execute(`
        UPDATE products 
        SET stock_type = 'size' 
        WHERE id = ?
      `, [productId]);
      
    } else {
      // Criar novo produto para exemplo
      console.log("🆕 Criando novo produto Nike Air Max...");
      
      const [result] = await db.execute(`
        INSERT INTO products (
          name, description, base_price, suggested_price, 
          category_id, stock_type, active, sell_without_stock, photo
        ) VALUES (
          'Tênis Nike Air Max Plus',
          'Tênis esportivo com tecnologia Air Max',
          299.90, 399.90, 
          (SELECT id FROM categories WHERE name = 'Calçados' LIMIT 1),
          'size', 1, 0, 'uploads/products/nike-air-max-plus.webp'
        )
      `);
      
      productId = (result as any).insertId;
      console.log(`✅ Produto criado (ID: ${productId})`);
    }
    
    // Obter cores disponíveis
    const [colors] = await db.execute(`
      SELECT id, name FROM colors 
      WHERE name IN ('Preto', 'Branco', 'Azul', 'Vermelho')
      ORDER BY name
    `);
    
    // Obter tamanhos disponíveis
    const [sizes] = await db.execute(`
      SELECT id, size, display_order FROM sizes 
      WHERE size IN ('37', '38', '39', '40', '41', '42', '43', '44')
      ORDER BY display_order
    `);
    
    console.log(`📏 ${(sizes as any[]).length} tamanhos disponíveis`);
    console.log(`🎨 ${(colors as any[]).length} cores disponíveis`);
    
    // Limpar variantes existentes do produto
    await db.execute(`DELETE FROM product_variants WHERE product_id = ?`, [productId]);
    
    // Criar variantes com estoque por tamanho
    let variantCount = 0;
    for (const color of colors as any[]) {
      for (const size of sizes as any[]) {
        // Variar o estoque para simular realidade
        const stockAmount = Math.floor(Math.random() * 15) + 5; // Entre 5 e 20
        
        await db.execute(`
          INSERT INTO product_variants (
            product_id, size_id, color_id, stock, price_override
          ) VALUES (?, ?, ?, ?, 0)
        `, [productId, size.id, color.id, stockAmount]);
        
        variantCount++;
      }
    }
    
    console.log(`✅ ${variantCount} variantes criadas com estoque individual`);
    
    // Verificar resultado
    const [variants] = await db.execute(`
      SELECT 
        s.size,
        c.name as cor,
        pv.stock
      FROM product_variants pv
      INNER JOIN sizes s ON pv.size_id = s.id
      INNER JOIN colors c ON pv.color_id = c.id
      WHERE pv.product_id = ?
      ORDER BY s.display_order, c.name
    `, [productId]);
    
    console.log("\n📦 Estoque por tamanho criado:");
    console.table(variants);
    
    // Resumo final
    const [summary] = await db.execute(`
      SELECT 
        COUNT(*) as total_variants,
        SUM(stock) as total_stock,
        AVG(stock) as avg_stock_per_variant,
        MIN(stock) as min_stock,
        MAX(stock) as max_stock
      FROM product_variants 
      WHERE product_id = ?
    `, [productId]);
    
    console.log("\n📊 Resumo do estoque:");
    console.table(summary);
    
    console.log(`\n✅ Produto configurado com sucesso! ID: ${productId}`);
    console.log("🔄 Agora você pode alternar entre os tipos de estoque no painel administrativo");
    
  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await db.end();
  }
}

setupSizeStockExample();
