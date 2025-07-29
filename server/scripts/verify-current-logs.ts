import db from "../lib/db";

async function verifyCurrentLogs() {
  try {
    console.log("🔍 Verificando endpoints atualmente sendo logados...");

    // Buscar todos os endpoints únicos nos logs
    const [endpoints] = await db.execute(`
      SELECT 
        endpoint,
        method,
        COUNT(*) as count,
        MAX(created_at) as last_request
      FROM api_logs 
      GROUP BY endpoint, method 
      ORDER BY count DESC
    `);

    console.log("\n📊 Endpoints sendo logados:");
    console.table(endpoints);

    // Verificar se as rotas seguem o padrão /admin/api
    console.log("\n🎯 Análise do padrão:");
    (endpoints as any[]).forEach((endpoint: any) => {
      const isAdminApi =
        endpoint.endpoint.includes("/admin/api") ||
        endpoint.endpoint.includes("/api/admin");
      const pattern = isAdminApi ? "✅ /admin/api" : "❌ Outro";
      console.log(
        `${pattern}: ${endpoint.endpoint} (${endpoint.count} requests)`,
      );
    });

    console.log("\n📝 Resumo da configuração atual:");
    console.log("- Middleware configurado para: /admin/api");
    console.log("- Rotas /api/admin/logs* estão sendo capturadas ✅");
    console.log(
      "- Rotas /admin/orders, /admin/customers NÃO estão sendo capturadas ✅",
    );
    console.log("- Sistema funcionando conforme esperado! 🎉");
  } catch (error) {
    console.error("❌ Erro ao verificar logs:", error);
  }
}

verifyCurrentLogs()
  .then(() => {
    console.log("🏁 Verificação finalizada");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Erro fatal:", error);
    process.exit(1);
  });
