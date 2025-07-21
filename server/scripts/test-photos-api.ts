import db from "../lib/db";

async function testPhotosAPI() {
  try {
    console.log("🧪 Testando se as fotos estão sendo retornadas...");

    // Test 1: Direct query
    console.log("\n1. Query direta no banco:");
    const [products] = await db.execute(`
      SELECT p.id, p.name, p.photo, p.base_price
      FROM products p 
      WHERE p.active = true AND p.photo IS NOT NULL
      LIMIT 5
    `);
    
    console.table(products);

    // Test 2: Simulate API endpoint
    console.log("\n2. Simulando endpoint da API:");
    const page = 1;
    const limit = 5;
    const offset = (page - 1) * limit;

    const whereClause = 'WHERE p.active = true';
    const queryParams: any[] = [];

    const productsQuery = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.base_price,
        p.suggested_price,
        p.photo,
        p.active,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ORDER BY p.name
      LIMIT ? OFFSET ?
    `;

    const [apiProducts] = await db.execute(productsQuery, [
      ...queryParams,
      parseInt(limit.toString()),
      parseInt(offset.toString()),
    ]);

    console.log(`Produtos encontrados: ${(apiProducts as any[]).length}`);
    console.table(apiProducts);

    process.exit(0);
  } catch (error) {
    console.error("❌ Erro no teste:", error);
    process.exit(1);
  }
}

testPhotosAPI();
