import db from "../lib/db";

async function debugAuth() {
  try {
    console.log("🔍 Debugando autenticação...");

    // 1. Verificar dados na customer_auth
    const [customers] = await db.execute(
      "SELECT * FROM customer_auth WHERE email = ?",
      ["maria.silva@email.com"],
    );

    console.log("👤 Dados do customer_auth:", customers);

    // 2. Verificar todos os WhatsApp na tabela
    const [allCustomers] = await db.execute(
      "SELECT id, name, email, whatsapp, LENGTH(whatsapp) as whatsapp_length FROM customer_auth LIMIT 5",
    );

    console.log("📱 Todos os WhatsApp cadastrados:");
    console.table(allCustomers);
  } catch (error) {
    console.error("❌ Erro no debug:", error);
  }
}

// Executar
debugAuth()
  .then(() => {
    console.log("🏁 Debug finalizado");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Erro fatal:", error);
    process.exit(1);
  });
