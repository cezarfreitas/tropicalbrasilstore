import db from "../lib/db";
import { ensureFullImageUrl } from "../lib/image-uploader";

async function finalCheck649() {
  try {
    console.log("🎯 Verificação final do produto 649...\n");

    // Check product basic info
    const [product] = await db.execute(
      `SELECT p.*, c.name as category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.id = 649 AND p.active = true`
    );

    if ((product as any[]).length === 0) {
      console.log("❌ Produto 649 não encontrado ou não está ativo");
      return;
    }

    const productData = (product as any[])[0];
    console.log("📦 Produto básico:");
    console.log(`   ID: ${productData.id}`);
    console.log(`   Nome: ${productData.name}`);
    console.log(`   Foto: ${productData.photo || 'null'}`);
    console.log(`   Ativo: ${productData.active}`);
    console.log(`   Vender sem estoque: ${productData.sell_without_stock}`);
    console.log(`   Categoria: ${productData.category_name}\n`);

    // Check variants with the new query (same as API)
    const variantStockCondition = productData.sell_without_stock ? "" : "AND pv.stock > 0";
    const [variantRows] = await db.execute(
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
       WHERE pv.product_id = 649 ${variantStockCondition}
       ORDER BY s.display_order, c.name`
    );

    console.log(`🎨 Variantes encontradas: ${(variantRows as any[]).length}`);
    (variantRows as any[]).forEach((variant, index) => {
      const fullImageUrl = ensureFullImageUrl(variant.image_url);
      console.log(`   ${index + 1}. Cor: ${variant.color_name} (ID: ${variant.color_id})`);
      console.log(`      Tamanho: ${variant.size} (ID: ${variant.size_id})`);
      console.log(`      Estoque: ${variant.stock}`);
      console.log(`      Preço: ${variant.price_override}`);
      console.log(`      Image URL original: ${variant.image_url || 'null'}`);
      console.log(`      Image URL processada: ${fullImageUrl || 'null'}`);
      console.log('');
    });

    // Check available grades 
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
       WHERE pcg.product_id = 649 AND g.active = true`
    );

    console.log(`📊 Grades disponíveis: ${(gradeRows as any[]).length}`);
    (gradeRows as any[]).forEach((grade, index) => {
      console.log(`   ${index + 1}. Grade: ${grade.name} (ID: ${grade.id})`);
      console.log(`      Cor: ${grade.color_name} (ID: ${grade.color_id})`);
      console.log('');
    });

    // Test the actual API response simulation
    console.log("🔧 Simulando resposta da API...");
    
    // Process variant image URLs to ensure they are full URLs
    const processedVariants = (variantRows as any[]).map((variant) => ({
      ...variant,
      image_url: ensureFullImageUrl(variant.image_url),
    }));

    // Process product photo to ensure it's a full URL
    const processedProduct = {
      ...productData,
      photo: ensureFullImageUrl(productData.photo),
      variants: processedVariants,
      available_grades: gradeRows
    };

    console.log("\n✅ Produto processado para API:");
    console.log(`   Photo: ${processedProduct.photo || 'null'}`);
    console.log(`   Variants com imagens: ${processedVariants.filter(v => v.image_url).length}/${processedVariants.length}`);
    
    if (processedVariants.length > 0) {
      console.log("   URLs das imagens das variantes:");
      processedVariants.forEach((v, i) => {
        if (v.image_url) {
          console.log(`     ${i + 1}. ${v.color_name}: ${v.image_url}`);
        }
      });
    }

    console.log("\n🎯 Resultado esperado no frontend:");
    console.log(`   • Produto terá photo: ${processedProduct.photo ? '✅' : '❌'}`);
    console.log(`   • Variantes com imagens: ${processedVariants.filter(v => v.image_url).length > 0 ? '✅' : '❌'}`);
    console.log(`   • Grades disponíveis: ${(gradeRows as any[]).length > 0 ? '✅' : '❌'}`);

  } catch (error) {
    console.error("❌ Erro na verificação:", error);
  } finally {
    process.exit(0);
  }
}

finalCheck649();
