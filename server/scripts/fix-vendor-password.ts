import db from "../lib/db";
import bcrypt from "bcryptjs";

async function fixVendorPassword() {
  try {
    console.log("🔧 Verificando estrutura da tabela vendors...");
    
    // Check current vendors table structure
    const [columns] = await db.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'vendors' 
      AND TABLE_SCHEMA = DATABASE()
    `);

    console.log("Colunas na tabela vendors:", (columns as any[]).map(c => c.COLUMN_NAME));

    // Check if password column exists
    const [passwordColumns] = await db.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'vendors' 
      AND COLUMN_NAME = 'password'
      AND TABLE_SCHEMA = DATABASE()
    `);

    if ((passwordColumns as any[]).length === 0) {
      console.log("➕ Adicionando coluna password...");
      
      // Add password column
      await db.execute(`
        ALTER TABLE vendors 
        ADD COLUMN password VARCHAR(255) AFTER email
      `);

      // Set default password for existing vendors
      const defaultPassword = await bcrypt.hash("123456", 10);
      await db.execute(`
        UPDATE vendors 
        SET password = ? 
        WHERE password IS NULL OR password = ''
      `, [defaultPassword]);

      console.log("✅ Coluna password adicionada e senha padrão definida");
    } else {
      console.log("ℹ️ Coluna password já existe");

      // Check if any vendor is missing password
      const [vendorsWithoutPassword] = await db.execute(`
        SELECT COUNT(*) as count FROM vendors WHERE password IS NULL OR password = ''
      `);

      if ((vendorsWithoutPassword as any[])[0].count > 0) {
        console.log("🔑 Definindo senha padrão para vendedores sem senha...");
        const defaultPassword = await bcrypt.hash("123456", 10);
        await db.execute(`
          UPDATE vendors 
          SET password = ? 
          WHERE password IS NULL OR password = ''
        `, [defaultPassword]);
        console.log("✅ Senhas padrão definidas");
      }
    }

    // Check if last_login column exists
    const [lastLoginColumns] = await db.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'vendors' 
      AND COLUMN_NAME = 'last_login'
      AND TABLE_SCHEMA = DATABASE()
    `);

    if ((lastLoginColumns as any[]).length === 0) {
      console.log("➕ Adicionando coluna last_login...");
      
      await db.execute(`
        ALTER TABLE vendors 
        ADD COLUMN last_login TIMESTAMP NULL AFTER active
      `);

      console.log("✅ Coluna last_login adicionada");
    } else {
      console.log("ℹ️ Coluna last_login já existe");
    }

    // Show current vendors
    const [vendors] = await db.execute(`
      SELECT id, name, email, 
             CASE WHEN password IS NOT NULL AND password != '' THEN 'Com senha' ELSE 'Sem senha' END as senha_status,
             active
      FROM vendors
    `);

    console.log("📋 Vendedores cadastrados:");
    (vendors as any[]).forEach(vendor => {
      console.log(`  - ${vendor.name} (${vendor.email}) - ${vendor.senha_status} - ${vendor.active ? 'Ativo' : 'Inativo'}`);
    });

    console.log("\n🔐 Credenciais para teste:");
    console.log("Email: joao.silva@empresa.com");
    console.log("Senha: 123456");

    process.exit(0);

  } catch (error) {
    console.error("❌ Erro na migração:", error);
    process.exit(1);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fixVendorPassword();
}

export { fixVendorPassword };
