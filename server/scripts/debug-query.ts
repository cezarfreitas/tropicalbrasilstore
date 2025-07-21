import db from "../lib/db";

async function debugQuery() {
  try {
    console.log("🔍 Debugando query SQL...");

    const page = 1;
    const limit = 5;
    const offset = (page - 1) * limit;
    const queryParams: any[] = [];

    console.log(`Parâmetros: page=${page}, limit=${limit}, offset=${offset}`);
    console.log(`QueryParams:`, queryParams);
    console.log(`Types: limit=${typeof limit}, offset=${typeof offset}`);

    // Test simple query first
    console.log("\n1. Query simples:");
    const [simple] = await db.execute("SELECT COUNT(*) as total FROM products WHERE active = true");
    console.log("Resultado:", simple);

    // Test query with parameters
    console.log("\n2. Query com parâmetros (sem LIMIT/OFFSET):");
    const [withParams] = await db.execute(
      "SELECT p.id, p.name FROM products p WHERE p.active = true ORDER BY p.name",
      []
    );
    console.log(`Encontrados: ${(withParams as any[]).length} produtos`);

    // Test with LIMIT/OFFSET
    console.log("\n3. Query com LIMIT/OFFSET:");
    try {
      const [withLimit] = await db.execute(
        "SELECT p.id, p.name FROM products p WHERE p.active = true ORDER BY p.name LIMIT ? OFFSET ?",
        [limit, offset]
      );
      console.log(`Sucesso! Encontrados: ${(withLimit as any[]).length} produtos`);
    } catch (err) {
      console.error("Erro com LIMIT/OFFSET original:", err.message);
      
      // Try with explicit numbers
      console.log("\n4. Tentando com números explícitos:");
      const [withExplicit] = await db.execute(
        "SELECT p.id, p.name FROM products p WHERE p.active = true ORDER BY p.name LIMIT 5 OFFSET 0"
      );
      console.log(`Sucesso com números explícitos! Encontrados: ${(withExplicit as any[]).length} produtos`);
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Erro no debug:", error);
    process.exit(1);
  }
}

debugQuery();
