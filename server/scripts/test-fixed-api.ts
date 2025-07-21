import db from "../lib/db";

async function testFixedAPI() {
  try {
    console.log("🧪 Testando API corrigida...");

    const page = 1;
    const limit = 5;
    const offset = (page - 1) * limit;

    const whereClause = 'WHERE p.active = true';
    const queryParams: any[] = [];

    // Test the fixed query
    const limitNum = parseInt(limit.toString());
    const offsetNum = parseInt(offset.toString());
    
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
      LIMIT ${limitNum} OFFSET ${offsetNum}
    `;

    const [products] = await db.execute(productsQuery, queryParams);

    console.log(`✅ Sucesso! Encontrados: ${(products as any[]).length} produtos`);
    
    // Check if photos are included
    const productsWithPhotos = (products as any[]).filter(p => p.photo);
    console.log(`📷 Produtos com fotos: ${productsWithPhotos.length}`);
    
    if (productsWithPhotos.length > 0) {
      console.log("\nPrimeiros 3 produtos com fotos:");
      console.table(productsWithPhotos.slice(0, 3).map(p => ({
        id: p.id,
        name: p.name,
        photo: p.photo,
        price: p.base_price
      })));
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Erro na API corrigida:", error);
    process.exit(1);
  }
}

testFixedAPI();
