import db from "../lib/db";

async function checkApiLogsInDatabase() {
  try {
    console.log("🔍 Verificando se os logs estão no banco de dados...");

    // 1. Verificar se a tabela api_logs existe
    console.log("\n📋 Verificando estrutura da tabela api_logs:");
    try {
      const [columns] = await db.execute("DESCRIBE api_logs");
      console.log("✅ Tabela api_logs existe!");
      console.table(columns);
    } catch (error) {
      console.log("❌ Tabela api_logs não existe:", error);
      return;
    }

    // 2. Contar total de registros
    console.log("\n📊 Contando registros na tabela api_logs:");
    const [countResult] = await db.execute(
      "SELECT COUNT(*) as total FROM api_logs",
    );
    const total = (countResult as any[])[0].total;
    console.log(`✅ Total de logs no banco: ${total}`);

    // 3. Mostrar últimos 5 registros
    if (total > 0) {
      console.log("\n📝 Últimos 5 logs registrados:");
      const [logs] = await db.execute(`
        SELECT 
          id,
          method,
          endpoint,
          response_status,
          response_time_ms,
          created_at
        FROM api_logs 
        ORDER BY created_at DESC 
        LIMIT 5
      `);
      console.table(logs);

      // 4. Verificar logs por endpoint
      console.log("\n📈 Logs agrupados por endpoint:");
      const [grouped] = await db.execute(`
        SELECT 
          endpoint,
          method,
          COUNT(*) as count,
          AVG(response_time_ms) as avg_time
        FROM api_logs 
        GROUP BY endpoint, method 
        ORDER BY count DESC 
        LIMIT 5
      `);
      console.table(grouped);
    } else {
      console.log("⚠️ Nenhum log encontrado no banco de dados");
    }

    // 5. Testar inserção manual de um log
    console.log("\n🧪 Testando inserção manual de um log...");
    try {
      await db.execute(
        `
        INSERT INTO api_logs 
        (method, endpoint, user_agent, ip_address, request_headers, request_body, response_status, response_time_ms) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          "GET",
          "/admin/test",
          "Test User Agent",
          "127.0.0.1",
          JSON.stringify({ test: "headers" }),
          JSON.stringify({ test: "body" }),
          200,
          150,
        ],
      );
      console.log("✅ Log de teste inserido com sucesso!");

      // Verificar se foi inserido
      const [newCount] = await db.execute(
        "SELECT COUNT(*) as total FROM api_logs",
      );
      console.log(`📊 Novo total de logs: ${(newCount as any[])[0].total}`);
    } catch (error) {
      console.log("❌ Erro ao inserir log de teste:", error);
    }
  } catch (error) {
    console.error("❌ Erro ao verificar logs no banco:", error);
  }
}

// Executar
checkApiLogsInDatabase()
  .then(() => {
    console.log("🏁 Verificação finalizada");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Erro fatal:", error);
    process.exit(1);
  });
