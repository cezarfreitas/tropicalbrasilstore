import db from "../lib/db";
import { ensureFullImageUrl } from "../lib/image-uploader";

async function testNewAPILogic() {
  try {
    console.log("🧪 Testando nova lógica da API para produto 649...\n");

    const productId = 649;

    // Get product basic info
    const [productRows] = await db.execute(
      `SELECT p.*, c.name as category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.id = ? AND p.active = true`,
      [productId],
    );

    if (productRows.length === 0) {
      console.log("❌ Produto não encontrado");
      return;
    }

    const product = (productRows as any)[0];
    console.log("📦 Produto encontrado:", product.name);

    // Check if this product has grades (NEW LOGIC)
    const [hasGrades] = await db.execute(
      "SELECT COUNT(*) as count FROM product_color_grades WHERE product_id = ?",
      [productId]
    );

    console.log(`📊 Produto tem grades: ${(hasGrades as any[])[0].count > 0 ? 'SIM' : 'NÃO'}`);

    let variantRows: any[] = [];

    if ((hasGrades as any[])[0].count > 0) {
      // Product has grades - get color variants
      console.log("🎨 Buscando variantes de cor...");
      const [colorVariantRows] = await db.execute(
        `SELECT 
          pcv.id,
          NULL as size_id,
          pcv.color_id,
          0 as stock,
          pcv.price as price_override,
          NULL as size,
          NULL as display_order,
          c.name as color_name,
          c.hex_code,
          pcv.image_url
         FROM product_color_variants pcv
         LEFT JOIN colors c ON pcv.color_id = c.id
         WHERE pcv.product_id = ? AND pcv.active = true
         ORDER BY c.name`,
        [productId],
      );
      variantRows = colorVariantRows as any[];
      console.log(`   Encontradas ${variantRows.length} variantes de cor`);
    } else {
      // Product doesn't have grades - get size variants
      console.log("📏 Buscando variantes de tamanho...");
      const variantStockCondition = product.sell_without_stock ? "" : "AND pv.stock > 0";
      const [sizeVariantRows] = await db.execute(
        `SELECT 
          pv.id,
          pv.size_id,
          pv.color_id,
          pv.stock,
          COALESCE(pv.price_override, 0) as price_override,
          s.size,
          s.display_order,
          c.name as color_name,
          c.hex_code,
          pcv.image_url
         FROM product_variants pv
         LEFT JOIN sizes s ON pv.size_id = s.id
         LEFT JOIN colors c ON pv.color_id = c.id
         LEFT JOIN product_color_variants pcv ON (pv.product_id = pcv.product_id AND pv.color_id = pcv.color_id)
         WHERE pv.product_id = ? ${variantStockCondition}
         ORDER BY s.display_order, c.name`,
        [productId],
      );
      variantRows = sizeVariantRows as any[];
      console.log(`   Encontradas ${variantRows.length} variantes de tamanho`);
    }

    // Process variants
    console.log("\n🔧 Processando variantes:");
    variantRows.forEach((variant, index) => {
      const fullImageUrl = ensureFullImageUrl(variant.image_url);
      console.log(`   ${index + 1}. ${variant.color_name || 'Sem cor'}`);
      console.log(`      ID: ${variant.id}`);
      console.log(`      Color ID: ${variant.color_id}`);
      console.log(`      Size: ${variant.size || 'N/A'}`);
      console.log(`      Stock: ${variant.stock}`);
      console.log(`      Price: ${variant.price_override}`);
      console.log(`      Image URL original: ${variant.image_url || 'null'}`);
      console.log(`      Image URL processada: ${fullImageUrl || 'null'}`);
      console.log('');
    });

    // Get available grades
    const [gradeRows] = await db.execute(
      `SELECT DISTINCT
        g.id,
        g.name,
        g.description,
        c.name as color_name,
        c.hex_code,
        pcg.color_id
       FROM grade_vendida g
       INNER JOIN product_color_grades pcg ON g.id = pcg.grade_id
       INNER JOIN colors c ON pcg.color_id = c.id
       WHERE pcg.product_id = ? AND g.active = true`,
      [productId],
    );

    console.log(`📊 Grades disponíveis: ${(gradeRows as any[]).length}`);

    // Final result
    const processedVariants = variantRows.map((variant) => ({
      ...variant,
      image_url: ensureFullImageUrl(variant.image_url),
    }));

    const processedProduct = {
      ...product,
      photo: ensureFullImageUrl(product.photo),
      variants: processedVariants,
      available_grades: gradeRows
    };

    console.log("\n✅ RESULTADO FINAL:");
    console.log(`   Photo: ${processedProduct.photo || 'null'}`);
    console.log(`   Total de variantes: ${processedVariants.length}`);
    console.log(`   Variantes com imagens: ${processedVariants.filter(v => v.image_url).length}`);
    console.log(`   Grades: ${(gradeRows as any[]).length}`);

    if (processedVariants.length > 0) {
      console.log("\n🖼️ URLs das imagens:");
      processedVariants.forEach((v, i) => {
        if (v.image_url) {
          console.log(`   ${i + 1}. ${v.color_name}: ${v.image_url}`);
        }
      });
    }

    console.log("\n🎯 Status no frontend:");
    console.log(`   • Exibirá imagem: ${processedProduct.photo || processedVariants.some(v => v.image_url) ? '✅ SIM' : '❌ NÃO'}`);

  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    process.exit(0);
  }
}

testNewAPILogic();
