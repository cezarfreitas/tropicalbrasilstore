import db from "../lib/db";

async function checkWooVariants() {
  try {
    console.log("🔍 Verificando variantes WooCommerce para produto 150...");

    // 1. Verificar product_color_variants (WooCommerce style)
    console.log("\n🎨 Product color variants (WooCommerce):");
    const [wooVariants] = await db.execute(`
      SELECT 
        pcv.*,
        c.name as color_name
      FROM product_color_variants pcv
      LEFT JOIN colors c ON pcv.color_id = c.id
      WHERE pcv.product_id = 150
    `);
    console.table(wooVariants);

    console.log(
      `📊 Total WooCommerce variants: ${(wooVariants as any[]).length}`,
    );

    // 2. Verificar product_variants (sistema antigo)
    console.log("\n📐 Product variants (sistema antigo):");
    const [oldVariants] = await db.execute(`
      SELECT 
        COUNT(*) as total_variants,
        COUNT(CASE WHEN stock > 0 THEN 1 END) as with_stock,
        COUNT(CASE WHEN stock = 0 THEN 1 END) as without_stock
      FROM product_variants
      WHERE product_id = 150
    `);
    console.table(oldVariants);

    // 3. Explicar o problema
    console.log("\n🔍 Análise do problema:");

    if ((wooVariants as any[]).length > 0) {
      console.log("✅ Existem variantes WooCommerce");
      console.log("   → API usa essas variantes PRIMEIRO");
      console.log(
        "   → Cada cor é uma variante única (sem tamanhos individuais)",
      );
      console.log("   → Por isso aparece 'size: undefined'");
    } else {
      console.log("❌ Não existem variantes WooCommerce");
      console.log("   → API deveria usar variantes antigas (product_variants)");
    }

    // 4. Mostrar a lógica da API
    console.log("\n📋 Lógica da API store-simple.ts:");
    console.log(
      "1. Primeiro tenta buscar WooCommerce variants (product_color_variants)",
    );
    console.log("2. Se não encontrar, usa system antigo (product_variants)");
    console.log("3. Como encontrou WooCommerce variants, para por aí");
    console.log("4. Resultado: só cores, sem tamanhos individuais");

    // 5. Solução
    console.log("\n💡 Soluções possíveis:");
    console.log("A. Deletar product_color_variants para usar product_variants");
    console.log("B. Criar grades adequadas para o produto");
    console.log("C. Modificar a API para considerar ambos os sistemas");
  } catch (error) {
    console.error("❌ Erro ao verificar variantes:", error);
  }
}

checkWooVariants()
  .then(() => {
    console.log("🏁 Verificação finalizada");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Erro fatal:", error);
    process.exit(1);
  });
