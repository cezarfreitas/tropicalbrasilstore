import db from "../lib/db";

async function testSimpleLogsQuery() {
  try {
    console.log("🔍 Testando query simples de logs...");

    // Teste 1: Query mais simples possível
    console.log("\n📋 Teste 1: SELECT simples");
    try {
      const [result1] = await db.execute(
        "SELECT COUNT(*) as total FROM api_logs",
      );
      console.log("✅ Count funcionou:", result1);
    } catch (error) {
      console.log("❌ Count falhou:", error);
    }

    // Teste 2: SELECT com LIMIT sem parâmetros
    console.log("\n📋 Teste 2: SELECT com LIMIT fixo");
    try {
      const [result2] = await db.execute(`
        SELECT id, method, endpoint, created_at 
        FROM api_logs 
        ORDER BY created_at DESC 
        LIMIT 3
      `);
      console.log("✅ SELECT com LIMIT fixo funcionou:");
      console.table(result2);
    } catch (error) {
      console.log("❌ SELECT com LIMIT fixo falhou:", error);
    }

    // Teste 3: SELECT com LIMIT como parâmetro
    console.log("\n📋 Teste 3: SELECT com LIMIT como parâmetro");
    try {
      const [result3] = await db.execute(
        `
        SELECT id, method, endpoint, created_at 
        FROM api_logs 
        ORDER BY created_at DESC 
        LIMIT ?
      `,
        [3],
      );
      console.log("✅ SELECT com LIMIT parâmetro funcionou:");
      console.table(result3);
    } catch (error) {
      console.log("❌ SELECT com LIMIT parâmetro falhou:", error);
    }

    // Teste 4: SELECT com LIMIT e OFFSET como parâmetros
    console.log("\n📋 Teste 4: SELECT com LIMIT e OFFSET como parâmetros");
    try {
      const [result4] = await db.execute(
        `
        SELECT id, method, endpoint, created_at 
        FROM api_logs 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `,
        [3, 0],
      );
      console.log("✅ SELECT com LIMIT e OFFSET funcionou:");
      console.table(result4);
    } catch (error) {
      console.log("❌ SELECT com LIMIT e OFFSET falhou:", error);
    }

    // Teste 5: Verificar tipos dos parâmetros
    console.log("\n📋 Teste 5: Verificando tipos");
    const limit = 5;
    const offset = 0;
    console.log(`limit type: ${typeof limit}, value: ${limit}`);
    console.log(`offset type: ${typeof offset}, value: ${offset}`);

    try {
      const [result5] = await db.execute(
        `
        SELECT id, method, endpoint 
        FROM api_logs 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `,
        [limit, offset],
      );
      console.log("✅ Com variáveis funcionou:");
      console.table(result5);
    } catch (error) {
      console.log("❌ Com variáveis falhou:", error);
    }
  } catch (error) {
    console.error("❌ Erro geral:", error);
  }
}

testSimpleLogsQuery()
  .then(() => {
    console.log("🏁 Teste finalizado");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Erro fatal:", error);
    process.exit(1);
  });
