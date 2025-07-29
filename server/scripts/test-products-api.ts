import db from "../lib/db";

async function testProductsAPI() {
  try {
    console.log("🔍 Testando consulta de produtos...");

    // Testar consulta básica
    const [products] = await db.execute(`
      SELECT p.id, p.name, p.photo, p.base_price
      FROM products p
      WHERE p.active = true
      LIMIT 5
    `);

    console.log("✅ Consulta básica funcionou:", products);

    // Testar consulta mais complexa como na API
    const page = 1;
    const limit = 20;
    const offset = (page - 1) * limit;

    let baseQuery = `
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      WHERE p.active = true
    `;

    baseQuery += `
      GROUP BY p.id, p.name, p.description, p.base_price, p.suggested_price, p.photo, p.active, p.sell_without_stock, c.name
      HAVING SUM(pv.stock) > 0 OR p.sell_without_stock = 1
    `;

    // Testar contagem
    const countQuery = `SELECT COUNT(*) as total FROM (SELECT p.id ${baseQuery}) as subquery`;
    console.log("🔍 Executando query de contagem...");
    const [countResult] = await db.execute(countQuery, []);
    console.log("✅ Contagem funcionou:", countResult);

    // Testar query principal
    const productQuery = `
      SELECT
        p.id,
        p.name,
        p.description,
        p.base_price,
        p.suggested_price,
        p.photo,
        p.active,
        p.sell_without_stock,
        c.name as category_name,
        COUNT(DISTINCT pv.id) as variant_count,
        SUM(pv.stock) as total_stock
      ${baseQuery}
      ORDER BY p.name
      LIMIT ${limit} OFFSET ${offset}
    `;

    console.log("🔍 Executando query principal...");
    const [mainResult] = await db.execute(productQuery, []);
    console.log("✅ Query principal funcionou:", mainResult);

    // Testar busca de cores para um produto específico
    if ((mainResult as any[]).length > 0) {
      const product = (mainResult as any[])[0];
      console.log(`🔍 Testando cores para produto ${product.id}...`);

      const [wooColorRows] = await db.execute(
        `
        SELECT DISTINCT
          co.id,
          co.name,
          co.hex_code,
          pcv.image_url
        FROM product_color_variants pcv
        LEFT JOIN colors co ON pcv.color_id = co.id
        WHERE pcv.product_id = ? AND pcv.active = true AND co.id IS NOT NULL
        ORDER BY co.name
      `,
        [product.id],
      );

      console.log("✅ Busca de cores WooCommerce funcionou:", wooColorRows);

      // Testar busca de cores individuais
      const [individualColorRows] = await db.execute(
        `
        SELECT DISTINCT
          co.id,
          co.name,
          co.hex_code
        FROM product_variants pv
        LEFT JOIN colors co ON pv.color_id = co.id
        WHERE pv.product_id = ? AND pv.active = true AND co.id IS NOT NULL
        ORDER BY co.name
      `,
        [product.id],
      );

      console.log(
        "✅ Busca de cores individuais funcionou:",
        individualColorRows,
      );
    }
  } catch (error) {
    console.error("❌ Erro durante o teste:", error);
    console.error("Stack:", error.stack);
  } finally {
    await db.end();
  }
}

testProductsAPI();
