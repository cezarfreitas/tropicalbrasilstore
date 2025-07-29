import db from "../lib/db";

async function checkTableStructures() {
  try {
    console.log("🔍 Verificando estruturas das tabelas...");

    // Verificar tabela sizes
    console.log("\n📏 Estrutura da tabela 'sizes':");
    const [sizeColumns] = await db.execute("DESCRIBE sizes");
    console.table(sizeColumns);

    // Verificar tabela grade_vendida
    console.log("\n📊 Estrutura da tabela 'grade_vendida':");
    const [gradeColumns] = await db.execute("DESCRIBE grade_vendida");
    console.table(gradeColumns);

    // Verificar tabela colors
    console.log("\n🎨 Estrutura da tabela 'colors':");
    const [colorColumns] = await db.execute("DESCRIBE colors");
    console.table(colorColumns);
  } catch (error) {
    console.error("❌ Erro ao verificar tabelas:", error);
  }
}

// Executar
checkTableStructures()
  .then(() => {
    console.log("🏁 Verificação finalizada");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Erro fatal:", error);
    process.exit(1);
  });
