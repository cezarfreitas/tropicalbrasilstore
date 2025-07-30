import { Router } from "express";
import db from "../lib/db";
import bcrypt from "bcryptjs";

const router = Router();

router.get("/", async (req, res) => {
  try {
    console.log("🔧 Verificando estrutura da tabela vendors...");
    
    // Check current vendors table structure
    const [columns] = await db.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'vendors' 
      AND TABLE_SCHEMA = DATABASE()
    `);

    const columnNames = (columns as any[]).map(c => c.COLUMN_NAME);
    console.log("Colunas na tabela vendors:", columnNames);

    // Check if password column exists
    const hasPasswordColumn = columnNames.includes('password');

    if (!hasPasswordColumn) {
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
    const hasLastLoginColumn = columnNames.includes('last_login');

    if (!hasLastLoginColumn) {
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

    const vendorList = vendors as any[];

    res.json({
      success: true,
      message: "Migração de senha executada com sucesso",
      details: {
        passwordColumnExists: hasPasswordColumn,
        lastLoginColumnExists: hasLastLoginColumn,
        vendors: vendorList,
        testCredentials: {
          email: "joao.silva@empresa.com",
          password: "123456"
        }
      }
    });

  } catch (error) {
    console.error("❌ Erro na migração:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default router;
