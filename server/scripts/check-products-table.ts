import db from "../lib/db";

async function checkTable() {
  try {
    const [result] = await db.execute("DESCRIBE products");
    console.log("Colunas da tabela products:");
    console.table(result);
    process.exit(0);
  } catch (error) {
    console.error("Erro:", error);
    process.exit(1);
  }
}

checkTable();
