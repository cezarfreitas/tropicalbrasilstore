import db from "../lib/db";

async function fixProductVariants() {
  try {
    console.log("🔧 Corrigindo variantes do produto 150...");

    // 1. Mostrar situação atual
    console.log("\n📊 Situação atual:");
    const [wooCount] = await db.execute(
      `SELECT COUNT(*) as count FROM product_color_variants WHERE product_id = 150`
    );
    const [oldCount] = await db.execute(
      `SELECT COUNT(*) as count FROM product_variants WHERE product_id = 150`
    );
    
    console.log(`- WooCommerce variants: ${(wooCount as any[])[0].count}`);
    console.log(`- Individual variants: ${(oldCount as any[])[0].count}`);

    // 2. Deletar variantes WooCommerce para este produto
    console.log("\n🗑️ Removendo variantes WooCommerce...");
    const [deleteResult] = await db.execute(
      `DELETE FROM product_color_variants WHERE product_id = 150`
    );
    
    console.log(`✅ ${(deleteResult as any).affectedRows} variantes WooCommerce removidas`);

    // 3. Verificar se as variantes individuais têm estoque correto
    console.log("\n🔄 Verificando variantes individuais...");
    const [variants] = await db.execute(`
      SELECT 
        pv.id,
        pv.size_id,
        pv.color_id,
        pv.stock,
        s.size,
        c.name as color_name
      FROM product_variants pv
      LEFT JOIN sizes s ON pv.size_id = s.id
      LEFT JOIN colors c ON pv.color_id = c.id
      WHERE pv.product_id = 150
      ORDER BY c.name, s.display_order
    `);

    console.log(`✅ ${(variants as any[]).length} variantes individuais encontradas`);
    
    // Mostrar resumo por cor
    const colorSummary = new Map();
    (variants as any[]).forEach((v: any) => {
      const key = v.color_name;
      if (!colorSummary.has(key)) {
        colorSummary.set(key, { total: 0, sizes: [] });
      }
      const summary = colorSummary.get(key);
      summary.total++;
      summary.sizes.push(v.size);
    });

    console.log("\n📋 Resumo por cor:");
    colorSummary.forEach((summary, color) => {
      console.log(`- ${color}: ${summary.total} tamanhos (${summary.sizes.join(', ')})`);
    });

    // 4. Testar API após a correção
    console.log("\n🧪 Testando API após correção...");
    try {
      const response = await fetch('http://localhost:8080/api/store/products/150');
      if (response.ok) {
        const product = await response.json();
        console.log("✅ API funcionando após correção!");
        console.log({
          variants_count: product.variants?.length || 0,
          available_colors_count: product.available_colors?.length || 0,
          available_grades_count: product.available_grades?.length || 0
        });

        if (product.variants && product.variants.length > 0) {
          console.log("🎯 Primeiras variantes:");
          product.variants.slice(0, 3).forEach((v: any, i: number) => {
            console.log(`  ${i + 1}. ${v.color_name} - ${v.size} (Estoque: ${v.stock})`);
          });
        }
      } else {
        console.log(`❌ Erro na API: ${response.status}`);
      }
    } catch (apiError) {
      console.log("❌ Erro ao testar API:", apiError);
    }

    console.log("\n🎉 Correção concluída!");
    console.log("💡 Agora o produto deveria mostrar tamanhos individuais para seleção");

  } catch (error) {
    console.error("❌ Erro ao corrigir variantes:", error);
  }
}

fixProductVariants().then(() => {
  console.log("🏁 Correção finalizada");
  process.exit(0);
}).catch((error) => {
  console.error("💥 Erro fatal:", error);
  process.exit(1);
});
