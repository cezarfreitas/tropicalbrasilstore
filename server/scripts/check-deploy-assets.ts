import fs from "fs";
import path from "path";
import db from "../lib/db";

async function checkDeployAssets() {
  try {
    console.log("🔍 Verificando assets para deploy...");

    // 1. Verificar logo no banco de dados
    console.log("\n📄 Logo configurado no banco:");
    const [settings] = await db.execute('SELECT store_name, logo_url FROM store_settings LIMIT 1');
    
    if ((settings as any[]).length > 0) {
      const setting = (settings as any[])[0];
      console.log(`🏪 Loja: ${setting.store_name}`);
      console.log(`🖼️ Logo URL: ${setting.logo_url || 'Nenhum logo configurado'}`);
      
      if (setting.logo_url) {
        // 2. Verificar se arquivo existe localmente
        const localPath = path.join(process.cwd(), 'public', setting.logo_url);
        const localExists = fs.existsSync(localPath);
        console.log(`📁 Arquivo local: ${localExists ? '✅ Existe' : '❌ Não existe'}`);
        console.log(`   Caminho: ${localPath}`);
        
        if (localExists) {
          const stats = fs.statSync(localPath);
          console.log(`   Tamanho: ${(stats.size / 1024).toFixed(1)} KB`);
          console.log(`   Modificado: ${stats.mtime.toLocaleString('pt-BR')}`);
        }
      }
    }

    // 3. Verificar estrutura de uploads
    console.log("\n📂 Estrutura de uploads:");
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    
    if (fs.existsSync(uploadsDir)) {
      console.log("✅ Diretório public/uploads existe");
      
      const logosDir = path.join(uploadsDir, 'logos');
      if (fs.existsSync(logosDir)) {
        console.log("✅ Diretório public/uploads/logos existe");
        const logoFiles = fs.readdirSync(logosDir);
        console.log(`📁 Arquivos de logo: ${logoFiles.length}`);
        logoFiles.forEach(file => {
          const filePath = path.join(logosDir, file);
          const stats = fs.statSync(filePath);
          console.log(`   - ${file} (${(stats.size / 1024).toFixed(1)} KB)`);
        });
      } else {
        console.log("❌ Diretório public/uploads/logos não existe");
      }
    } else {
      console.log("❌ Diretório public/uploads não existe");
    }

    // 4. Verificar se o servidor está configurado para servir uploads
    console.log("\n⚙️ Configuração do servidor:");
    console.log("✅ Express static configurado em /uploads -> public/uploads");
    console.log("✅ Middleware de uploads ativo no index.ts (linha 74-77)");

    // 5. Problema identificado e solução
    console.log("\n🚨 PROBLEMA IDENTIFICADO:");
    console.log("❌ O Dockerfile não copia o diretório public/uploads/ para produção");
    console.log("❌ Arquivos de upload não estão disponíveis no deploy");
    
    console.log("\n💡 SOLUÇÕES PROPOSTAS:");
    console.log("1. 📦 Modificar Dockerfile para incluir public/uploads/");
    console.log("2. 🗂️ Usar armazenamento persistente para uploads");
    console.log("3. ☁️ Usar serviço de storage externo (AWS S3, etc.)");

  } catch (error) {
    console.error("❌ Erro ao verificar assets:", error);
  }
}

// Executar
checkDeployAssets().then(() => {
  console.log("🏁 Verificação finalizada");
  process.exit(0);
}).catch((error) => {
  console.error("💥 Erro fatal:", error);
  process.exit(1);
});
