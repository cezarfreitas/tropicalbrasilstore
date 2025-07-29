import db from "../lib/db";

async function debugProductVariants() {
  try {
    console.log("🔍 Debugando variantes do produto ID: 150...");

    // 1. Verificar variantes na tabela product_variants
    console.log("\n📋 Variantes na tabela product_variants:");
    const [variants] = await db.execute(`
      SELECT 
        pv.*,
        s.size as size_name,
        c.name as color_name
      FROM product_variants pv
      LEFT JOIN sizes s ON pv.size_id = s.id
      LEFT JOIN colors c ON pv.color_id = c.id
      WHERE pv.product_id = 150
    `);
    console.table(variants);

    // 2. Verificar se existem tamanhos na tabela sizes
    console.log("\n📐 Tamanhos disponíveis na tabela sizes:");
    const [sizes] = await db.execute(`
      SELECT id, size, display_order 
      FROM sizes 
      ORDER BY display_order
    `);
    console.table(sizes);

    // 3. Verificar grades disponíveis
    console.log("\n📊 Verificando grades para este produto:");
    const [grades] = await db.execute(`
      SELECT 
        gv.*,
        c.name as color_name
      FROM grade_vendida gv
      LEFT JOIN colors c ON gv.color_id = c.id
      WHERE gv.product_id = 150
    `);
    console.table(grades);

    // 4. Verificar grade templates
    console.log("\n📋 Templates de grade para este produto:");
    const [templates] = await db.execute(`
      SELECT 
        gt.*,
        s.size as size_name,
        gv.name as grade_name
      FROM grade_templates gt
      LEFT JOIN sizes s ON gt.size_id = s.id
      LEFT JOIN grade_vendida gv ON gt.grade_id = gv.id
      WHERE gv.product_id = 150
    `);
    console.table(templates);

    // 5. Verificar product_color_grades (WooCommerce style)
    console.log("\n🎨 Product color grades (WooCommerce style):");
    const [colorGrades] = await db.execute(`
      SELECT 
        pcg.*,
        c.name as color_name,
        gv.name as grade_name
      FROM product_color_grades pcg
      LEFT JOIN colors c ON pcg.color_id = c.id
      LEFT JOIN grade_vendida gv ON pcg.grade_id = gv.id
      WHERE pcg.product_id = 150
    `);
    console.table(colorGrades);

    // 6. Simular criação de variantes com tamanhos
    console.log("\n🛠️ Análise de problema:");
    
    if ((variants as any[]).length > 0) {
      console.log("✅ Existem variantes para o produto");
      
      const hasValidSizes = (variants as any[]).some(v => v.size_id !== null);
      if (!hasValidSizes) {
        console.log("❌ PROBLEMA: Variantes não têm size_id definido");
        console.log("   Solução: Precisa associar tamanhos às variantes");
      }
    } else {
      console.log("❌ PROBLEMA: Não existem variantes para o produto");
    }

    if ((sizes as any[]).length === 0) {
      console.log("❌ PROBLEMA: Não existem tamanhos na tabela sizes");
      console.log("   Solução: Precisa criar tamanhos padrão");
    }

    if ((grades as any[]).length === 0) {
      console.log("⚠️ Não existem grades para este produto");
      console.log("   Isso significa que usará seleção individual de tamanhos");
    }

  } catch (error) {
    console.error("❌ Erro no debug:", error);
  }
}

debugProductVariants().then(() => {
  console.log("🏁 Debug finalizado");
  process.exit(0);
}).catch((error) => {
  console.error("💥 Erro fatal:", error);
  process.exit(1);
});
