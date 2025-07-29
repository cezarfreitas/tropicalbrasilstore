import db from "../lib/db";

async function checkLogoConfig() {
  try {
    console.log("🔍 Verificando configuração do logo...");

    // 1. Estrutura da tabela store_settings
    console.log("\n📋 Estrutura da tabela store_settings:");
    const [columns] = await db.execute("DESCRIBE store_settings");
    console.table(columns);

    // 2. Dados atuais da tabela
    console.log("\n📄 Dados atuais na tabela store_settings:");
    const [settings] = await db.execute("SELECT * FROM store_settings LIMIT 1");
    console.table(settings);

    // 3. Verificar especificamente o logo_url
    console.log("\n🖼️ Logo URL atual:");
    const [logoData] = await db.execute(
      "SELECT id, store_name, logo_url FROM store_settings LIMIT 1",
    );

    if ((logoData as any[]).length > 0) {
      const logo = (logoData as any[])[0];
      console.log(`��� Loja: ${logo.store_name}`);
      console.log(`🖼️ Logo URL: ${logo.logo_url || "Nenhum logo configurado"}`);

      if (logo.logo_url) {
        console.log(`📁 Caminho do arquivo: ${logo.logo_url}`);
        console.log(`🌐 URL completa: http://localhost:8080${logo.logo_url}`);
      }
    } else {
      console.log(
        "❌ Nenhuma configuração encontrada na tabela store_settings",
      );
    }

    // 4. Verificar outros logos no sistema (se existirem)
    console.log("\n🔍 Verificando se existem outras referências de logo:");
    const [otherLogos] = await db.execute(`
      SHOW TABLES LIKE '%logo%'
    `);
    console.log("Tabelas com 'logo' no nome:", otherLogos);
  } catch (error) {
    console.error("❌ Erro ao verificar configuração do logo:", error);
  }
}

// Executar
checkLogoConfig()
  .then(() => {
    console.log("🏁 Verificação finalizada");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Erro fatal:", error);
    process.exit(1);
  });
