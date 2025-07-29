import db from "../lib/db";

async function setupProductGrades() {
  try {
    console.log("🔄 Configurando grades para o produto 150...");

    // 1. Verificar se já existem grades para o produto
    console.log("\n📊 Verificando grades existentes para produto 150:");
    const [existingColorGrades] = await db.execute(`
      SELECT
        pcg.*,
        c.name as color_name,
        gv.name as grade_name
      FROM product_color_grades pcg
      LEFT JOIN colors c ON pcg.color_id = c.id
      LEFT JOIN grade_vendida gv ON pcg.grade_id = gv.id
      WHERE pcg.product_id = 150
    `);
    console.table(existingColorGrades);

    // 2. Se não existirem grades, criar grades padrão
    if ((existingColorGrades as any[]).length === 0) {
      console.log("\n🔧 Criando grades padrão para chinelos...");

      // Criar grade masculina padrão
      const [gradeResult] = await db.execute(`
        INSERT INTO grade_vendida (name, description, active)
        VALUES ('Grade Masculina', 'Grade padrão para chinelos masculinos', 1)
      `);

      const gradeId = (gradeResult as any).insertId;
      console.log(`✅ Grade criada com ID: ${gradeId}`);

      // 4. Criar templates da grade (tamanhos com quantidades)
      const sizeTemplates = [
        { size_id: 4, required_quantity: 2 }, // 35
        { size_id: 5, required_quantity: 3 }, // 36
        { size_id: 6, required_quantity: 4 }, // 37
        { size_id: 7, required_quantity: 4 }, // 38
        { size_id: 8, required_quantity: 4 }, // 39
        { size_id: 9, required_quantity: 3 }, // 40
        { size_id: 10, required_quantity: 2 }, // 41
        { size_id: 11, required_quantity: 1 }, // 42
      ];

      console.log("\n📐 Criando templates da grade:");
      for (const template of sizeTemplates) {
        await db.execute(
          `
          INSERT INTO grade_templates (grade_id, size_id, required_quantity)
          VALUES (?, ?, ?)
        `,
          [gradeId, template.size_id, template.required_quantity],
        );

        console.log(
          `  ✅ Tamanho ${template.size_id}: ${template.required_quantity} unidades`,
        );
      }

      // 5. Associar grade às cores do produto
      const [productColors] = await db.execute(`
        SELECT DISTINCT color_id FROM product_variants WHERE product_id = 150
      `);

      console.log("\n🎨 Associando grade às cores:");
      for (const colorRow of productColors as any[]) {
        await db.execute(
          `
          INSERT INTO product_color_grades (product_id, color_id, grade_id)
          VALUES (?, ?, ?)
        `,
          [150, colorRow.color_id, gradeId],
        );

        console.log(`  ✅ Cor ${colorRow.color_id} associada à grade`);
      }

      console.log("\n🎉 Grades configuradas com sucesso!");
    } else {
      console.log("\n✅ Grades já existem para este produto");
    }

    // 6. Testar API após configuração
    console.log("\n🧪 Testando API após configuração de grades...");
    try {
      const response = await fetch(
        "http://localhost:8080/api/store/products/150",
      );
      if (response.ok) {
        const product = await response.json();
        console.log("✅ API funcionando após configuração!");
        console.log({
          variants_count: product.variants?.length || 0,
          available_colors_count: product.available_colors?.length || 0,
          available_grades_count: product.available_grades?.length || 0,
        });

        if (product.available_grades && product.available_grades.length > 0) {
          console.log("\n📊 Grades disponíveis:");
          product.available_grades.forEach((grade: any, index: number) => {
            console.log(
              `  ${index + 1}. ${grade.name} - Cor: ${grade.color_name}`,
            );
            console.log(`     Total: ${grade.total_quantity} peças`);
            console.log(
              `     Estoque completo: ${grade.has_full_stock ? "SIM" : "NÃO"}`,
            );
          });
        }
      } else {
        console.log(`❌ Erro na API: ${response.status}`);
      }
    } catch (apiError) {
      console.log("❌ Erro ao testar API:", apiError);
    }

    console.log(
      "\n💡 Agora o produto deveria mostrar 'Selecione a Grade' em vez de tamanhos individuais",
    );
  } catch (error) {
    console.error("❌ Erro ao configurar grades:", error);
  }
}

setupProductGrades()
  .then(() => {
    console.log("🏁 Configuração finalizada");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Erro fatal:", error);
    process.exit(1);
  });
