import db from "../lib/db";

async function checkGradeTemplatesStructure() {
  try {
    console.log("🔍 Verificando estrutura da tabela grade_templates...");
    
    const [columns] = await db.execute(`
      SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'grade_templates'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log("Colunas da tabela grade_templates:");
    console.table(columns);
    
    // Verificar algumas linhas da tabela
    const [rows] = await db.execute("SELECT * FROM grade_templates LIMIT 10");
    console.log("Dados de exemplo:");
    console.table(rows);
    
  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await db.end();
  }
}

checkGradeTemplatesStructure();
