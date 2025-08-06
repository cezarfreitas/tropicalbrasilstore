import db from "../lib/db";

async function debugAdmin() {
  try {
    console.log("🔍 === DIAGNÓSTICO COMPLETO DO ADMIN ===\n");

    // 1. Verificar produtos
    console.log("📦 PRODUTOS:");
    const [products] = await db.execute(`
      SELECT 
        id, name, sku, active, stock_type, photo,
        category_id, brand_id, gender_id, type_id,
        base_price, sale_price, suggested_price
      FROM products 
      ORDER BY id DESC 
      LIMIT 5
    `);
    
    if ((products as any[]).length > 0) {
      console.table(products);
    } else {
      console.log("❌ Nenhum produto encontrado");
    }

    // 2. Verificar variantes de cor
    console.log("\n🎨 VARIANTES DE COR:");
    const [colorVariants] = await db.execute(`
      SELECT 
        pcv.id,
        p.name as product_name,
        c.name as color_name,
        pcv.variant_name,
        pcv.variant_sku,
        pcv.image_url,
        pcv.price,
        pcv.sale_price,
        pcv.stock_total,
        pcv.active
      FROM product_color_variants pcv
      LEFT JOIN products p ON pcv.product_id = p.id
      LEFT JOIN colors c ON pcv.color_id = c.id
      ORDER BY pcv.id DESC
      LIMIT 5
    `);
    
    if ((colorVariants as any[]).length > 0) {
      console.table(colorVariants);
    } else {
      console.log("❌ Nenhuma variante de cor encontrada");
    }

    // 3. Verificar variantes normais
    console.log("\n📏 VARIANTES DE TAMANHO:");
    const [variants] = await db.execute(`
      SELECT 
        COUNT(*) as total_variants,
        COUNT(CASE WHEN image_url IS NOT NULL THEN 1 END) as with_images,
        COUNT(CASE WHEN stock > 0 THEN 1 END) as with_stock
      FROM product_variants
    `);
    console.table(variants);

    // 4. Verificar categorias
    console.log("\n📂 CATEGORIAS:");
    const [categories] = await db.execute(`
      SELECT id, name, show_in_menu
      FROM categories
      ORDER BY name
    `);
    
    if ((categories as any[]).length > 0) {
      console.table(categories);
    } else {
      console.log("❌ Nenhuma categoria encontrada");
    }

    // 5. Verificar marcas
    console.log("\n🏷️ MARCAS:");
    const [brands] = await db.execute(`
      SELECT id, name, description
      FROM brands 
      ORDER BY name
      LIMIT 5
    `);
    
    if ((brands as any[]).length > 0) {
      console.table(brands);
    } else {
      console.log("❌ Nenhuma marca encontrada");
    }

    // 6. Verificar cores
    console.log("\n🌈 CORES:");
    const [colors] = await db.execute(`
      SELECT id, name, hex_code
      FROM colors 
      ORDER BY name
      LIMIT 10
    `);
    
    if ((colors as any[]).length > 0) {
      console.table(colors);
    } else {
      console.log("❌ Nenhuma cor encontrada");
    }

    // 7. Verificar tamanhos
    console.log("\n📏 TAMANHOS:");
    const [sizes] = await db.execute(`
      SELECT id, size, display_order
      FROM sizes 
      ORDER BY display_order
    `);
    
    if ((sizes as any[]).length > 0) {
      console.table(sizes);
    } else {
      console.log("❌ Nenhum tamanho encontrado");
    }

    // 8. Verificar grades
    console.log("\n📊 GRADES:");
    const [grades] = await db.execute(`
      SELECT id, name, description, active
      FROM grade_vendida 
      ORDER BY name
      LIMIT 5
    `);
    
    if ((grades as any[]).length > 0) {
      console.table(grades);
    } else {
      console.log("❌ Nenhuma grade encontrada");
    }

    // 9. Verificar configurações da loja
    console.log("\n⚙️ CONFIGURAÇÕES DA LOJA:");
    const [settings] = await db.execute(`
      SELECT store_name, primary_color, secondary_color, minimum_order_value
      FROM store_settings 
      LIMIT 1
    `);
    
    if ((settings as any[]).length > 0) {
      console.table(settings);
    } else {
      console.log("❌ Nenhuma configuração encontrada");
    }

    // 10. Verificar upload de arquivos
    console.log("\n📁 VERIFICAÇÃO DE UPLOAD:");
    const fs = require('fs');
    const path = require('path');
    
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    const productsDir = path.join(uploadsDir, 'products');
    
    console.log(`📂 Diretório uploads existe: ${fs.existsSync(uploadsDir)}`);
    console.log(`📂 Diretório products existe: ${fs.existsSync(productsDir)}`);
    
    if (fs.existsSync(productsDir)) {
      const files = fs.readdirSync(productsDir);
      console.log(`📸 Total de arquivos: ${files.length}`);
      console.log(`📸 Últimos 5 arquivos:`, files.slice(-5));
    }

    // 11. Estatísticas gerais
    console.log("\n📊 ESTATÍSTICAS GERAIS:");
    const [stats] = await db.execute(`
      SELECT 
        (SELECT COUNT(*) FROM products) as total_products,
        (SELECT COUNT(*) FROM products WHERE active = 1) as active_products,
        (SELECT COUNT(*) FROM product_color_variants) as color_variants,
        (SELECT COUNT(*) FROM product_variants) as size_variants,
        (SELECT COUNT(*) FROM colors) as total_colors,
        (SELECT COUNT(*) FROM sizes) as total_sizes,
        (SELECT COUNT(*) FROM categories) as total_categories,
        (SELECT COUNT(*) FROM brands) as total_brands
    `);
    console.table(stats);

  } catch (error) {
    console.error("❌ Erro no diagnóstico:", error);
    throw error;
  }
}

// Execute if run directly
debugAdmin()
  .then(() => {
    console.log("\n🎉 Diagnóstico concluído!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Falha no diagnóstico:", error);
    process.exit(1);
  });
