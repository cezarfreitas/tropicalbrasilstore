import db from "../lib/db";

async function checkGradeStructure() {
  try {
    console.log("🔍 Verificando estrutura das tabelas de grade...");

    // 1. Verificar grade_vendida
    console.log("\n📋 Estrutura da tabela grade_vendida:");
    try {
      const [gradeColumns] = await db.execute("DESCRIBE grade_vendida");
      console.table(gradeColumns);
    } catch (error) {
      console.log("❌ Erro na tabela grade_vendida:", error);
    }

    // 2. Verificar grade_templates
    console.log("\n📋 Estrutura da tabela grade_templates:");
    try {
      const [templateColumns] = await db.execute("DESCRIBE grade_templates");
      console.table(templateColumns);
    } catch (error) {
      console.log("❌ Erro na tabela grade_templates:", error);
    }

    // 3. Verificar product_color_grades
    console.log("\n📋 Estrutura da tabela product_color_grades:");
    try {
      const [colorGradeColumns] = await db.execute(
        "DESCRIBE product_color_grades",
      );
      console.table(colorGradeColumns);
    } catch (error) {
      console.log("❌ Erro na tabela product_color_grades:", error);
    }

    // 4. Verificar se há dados nas tabelas
    console.log("\n📊 Verificando dados existentes:");

    const [gradeCount] = await db.execute(
      "SELECT COUNT(*) as count FROM grade_vendida",
    );
    console.log(`- Grades: ${(gradeCount as any[])[0].count}`);

    const [templateCount] = await db.execute(
      "SELECT COUNT(*) as count FROM grade_templates",
    );
    console.log(`- Templates: ${(templateCount as any[])[0].count}`);

    const [colorGradeCount] = await db.execute(
      "SELECT COUNT(*) as count FROM product_color_grades",
    );
    console.log(
      `- Associações produto-cor-grade: ${(colorGradeCount as any[])[0].count}`,
    );

    // 5. Mostrar relacionamento correto
    console.log("\n💡 Relacionamento correto das tabelas:");
    console.log("1. grade_vendida (grade básica)");
    console.log("2. grade_templates (tamanhos da grade com quantidades)");
    console.log("3. product_color_grades (associa produto + cor + grade)");
  } catch (error) {
    console.error("❌ Erro geral:", error);
  }
}

checkGradeStructure()
  .then(() => {
    console.log("🏁 Verificação finalizada");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Erro fatal:", error);
    process.exit(1);
  });
