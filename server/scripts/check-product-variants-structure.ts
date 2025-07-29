import db from "../lib/db";

async function checkProductVariantsStructure() {
  try {
    console.log("🔍 Verificando estrutura da tabela product_variants...");

    const [columns] = await db.execute(`
      SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_variants'
      ORDER BY ORDINAL_POSITION
    `);

    console.log("Colunas da tabela product_variants:");
    console.table(columns);

    // Verificar algumas linhas da tabela
    const [rows] = await db.execute("SELECT * FROM product_variants LIMIT 5");
    console.log("Dados de exemplo:");
    console.table(rows);
  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await db.end();
  }
}

checkProductVariantsStructure();
