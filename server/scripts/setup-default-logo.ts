import fs from "fs";
import path from "path";
import db from "../lib/db";

async function setupDefaultLogo() {
  try {
    console.log("🔄 Configurando logo padrão para deploy...");

    // 1. Verificar se já existe logo configurado
    const [settings] = await db.execute('SELECT logo_url FROM store_settings LIMIT 1');
    
    if ((settings as any[]).length > 0) {
      const logoUrl = (settings as any[])[0].logo_url;
      
      if (logoUrl) {
        // Verificar se o arquivo existe
        const logoPath = path.join(process.cwd(), 'public', logoUrl);
        
        if (fs.existsSync(logoPath)) {
          console.log("✅ Logo já configurado e arquivo existe");
          console.log(`🖼️ Logo: ${logoUrl}`);
          return;
        } else {
          console.log("⚠️ Logo configurado no banco mas arquivo não existe");
          console.log(`❌ Arquivo: ${logoPath}`);
        }
      }
    }

    // 2. Criar diretório de logos se não existir
    const logoDir = path.join(process.cwd(), 'public', 'uploads', 'logos');
    if (!fs.existsSync(logoDir)) {
      fs.mkdirSync(logoDir, { recursive: true });
      console.log("📁 Diretório de logos criado");
    }

    // 3. Verificar se existe algum logo no diretório
    const existingLogos = fs.readdirSync(logoDir);
    
    if (existingLogos.length > 0) {
      // Usar o primeiro logo encontrado
      const logoFile = existingLogos[0];
      const logoUrl = `/uploads/logos/${logoFile}`;
      
      console.log(`📷 Logo encontrado: ${logoFile}`);
      
      // Atualizar banco de dados
      await db.execute(
        'UPDATE store_settings SET logo_url = ? WHERE id = (SELECT * FROM (SELECT MIN(id) FROM store_settings) as temp)',
        [logoUrl]
      );
      
      console.log("✅ Logo configurado no banco de dados");
      console.log(`🖼️ URL: ${logoUrl}`);
    } else {
      console.log("ℹ️ Nenhum logo encontrado no diretório");
      console.log("💡 Para adicionar um logo:");
      console.log("   1. Faça upload através da interface de configurações");
      console.log("   2. Ou copie um arquivo para public/uploads/logos/");
      console.log("   3. E execute este script novamente");
    }

    // 4. Configurar logo fallback no código se necessário
    console.log("\n🔧 Configuração alternativa:");
    console.log("Se nenhum logo estiver disponível, o sistema usará:");
    console.log("- Ícone padrão do sistema");
    console.log("- Texto 'Logo da Loja' como fallback");

  } catch (error) {
    console.error("❌ Erro ao configurar logo padrão:", error);
  }
}

// Executar
setupDefaultLogo().then(() => {
  console.log("🏁 Configuração finalizada");
  process.exit(0);
}).catch((error) => {
  console.error("💥 Erro fatal:", error);
  process.exit(1);
});
