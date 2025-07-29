import db from "../lib/db";

async function debugGradesAPI() {
  try {
    console.log("🔍 Debugando por que as grades não aparecem na API...");

    // 1. Verificar grade existente
    console.log("\n📊 Grade existente:");
    const [grade] = await db.execute(`
      SELECT * FROM grade_vendida WHERE id = 10
    `);
    console.table(grade);

    // 2. Verificar templates da grade
    console.log("\n📐 Templates da grade 10:");
    const [templates] = await db.execute(`
      SELECT 
        gt.*,
        s.size,
        s.display_order
      FROM grade_templates gt
      LEFT JOIN sizes s ON gt.size_id = s.id
      WHERE gt.grade_id = 10
      ORDER BY s.display_order
    `);
    console.table(templates);

    // 3. Simular a query que a API usa para buscar grades
    console.log("\n🔍 Simulando query da API store-simple.ts:");

    const productId = 150;

    // Esta é a query exata da API
    const [gradeRows] = await db.execute(
      `SELECT DISTINCT
        g.id,
        g.name,
        g.description,
        c.name as color_name,
        c.hex_code,
        pcg.color_id
       FROM grade_vendida g
       INNER JOIN product_color_grades pcg ON g.id = pcg.grade_id
       INNER JOIN colors c ON pcg.color_id = c.id
       WHERE pcg.product_id = ? AND g.active = true`,
      [productId],
    );

    console.log(
      `📋 Resultado da query da API: ${(gradeRows as any[]).length} grades encontradas`,
    );
    console.table(gradeRows);

    // 4. Para cada grade, verificar templates
    if ((gradeRows as any[]).length > 0) {
      console.log("\n📋 Processando grades (simulando API):");

      for (const grade of gradeRows as any[]) {
        const [templateRows] = await db.execute(
          `SELECT gt.*, s.size, s.display_order
           FROM grade_templates gt
           LEFT JOIN sizes s ON gt.size_id = s.id
           WHERE gt.grade_id = ?
           ORDER BY s.display_order`,
          [grade.id],
        );

        console.log(
          `\n📐 Grade ${grade.name} (ID: ${grade.id}) - Cor: ${grade.color_name}`,
        );
        console.log(
          `   Templates encontrados: ${(templateRows as any[]).length}`,
        );

        if ((templateRows as any[]).length === 0) {
          console.log("   ❌ PROBLEMA: Nenhum template encontrado!");
        } else {
          let totalRequired = 0;
          console.log("   📊 Templates:");
          (templateRows as any[]).forEach((template: any) => {
            totalRequired += template.required_quantity;
            console.log(
              `     - ${template.size}: ${template.required_quantity} unidades`,
            );
          });
          console.log(`   📊 Total requerido: ${totalRequired} unidades`);
        }
      }
    } else {
      console.log("❌ PROBLEMA: Nenhuma grade encontrada pela query da API!");
      console.log("   Verificando motivos possíveis:");

      // Verificar se grade está ativa
      const [activeCheck] = await db.execute(
        "SELECT id, active FROM grade_vendida WHERE id = 10",
      );
      console.log("   - Grade ativa:", activeCheck);

      // Verificar relacionamento
      const [relationCheck] = await db.execute(`
        SELECT * FROM product_color_grades WHERE product_id = 150 AND grade_id = 10
      `);
      console.log("   - Relacionamento produto-grade:", relationCheck);
    }
  } catch (error) {
    console.error("❌ Erro no debug:", error);
  }
}

debugGradesAPI()
  .then(() => {
    console.log("🏁 Debug finalizado");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Erro fatal:", error);
    process.exit(1);
  });
