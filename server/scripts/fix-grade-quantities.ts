import db from "../lib/db";

async function fixGradeQuantities() {
  try {
    console.log("🔧 Corrigindo quantidades dos templates da grade...");

    // 1. Definir quantidades adequadas para cada tamanho
    const correctQuantities = [
      { size_id: 4, quantity: 2 }, // 35: 2 pares
      { size_id: 5, quantity: 3 }, // 36: 3 pares
      { size_id: 6, quantity: 4 }, // 37: 4 pares
      { size_id: 7, quantity: 4 }, // 38: 4 pares
      { size_id: 8, quantity: 4 }, // 39: 4 pares
      { size_id: 9, quantity: 3 }, // 40: 3 pares
      { size_id: 10, quantity: 2 }, // 41: 2 pares
      { size_id: 11, quantity: 1 }, // 42: 1 par
    ];

    console.log("\n📐 Atualizando quantidades dos templates:");

    for (const update of correctQuantities) {
      const [result] = await db.execute(
        `
        UPDATE grade_templates 
        SET required_quantity = ? 
        WHERE grade_id = 10 AND size_id = ?
      `,
        [update.quantity, update.size_id],
      );

      console.log(
        `  ✅ Tamanho ${update.size_id}: ${update.quantity} unidades`,
      );
    }

    // 2. Verificar resultado
    console.log("\n📊 Verificando templates atualizados:");
    const [updatedTemplates] = await db.execute(`
      SELECT 
        gt.*,
        s.size
      FROM grade_templates gt
      LEFT JOIN sizes s ON gt.size_id = s.id
      WHERE gt.grade_id = 10
      ORDER BY gt.size_id
    `);
    console.table(updatedTemplates);

    // 3. Calcular total
    const totalQuantity = correctQuantities.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
    console.log(`\n📊 Total da grade: ${totalQuantity} pares`);

    // 4. Testar API após correção
    console.log("\n🧪 Testando API após correção...");
    const response = await fetch(
      "http://localhost:8080/api/store/products/150",
    );

    if (response.ok) {
      const product = await response.json();
      console.log("✅ API após correção:");
      console.log({
        available_grades_count: product.available_grades?.length || 0,
        available_colors_count: product.available_colors?.length || 0,
      });

      if (product.available_grades && product.available_grades.length > 0) {
        console.log("\n🎉 GRADES AGORA DISPONÍVEIS!");
        product.available_grades.forEach((grade: any, index: number) => {
          console.log(
            `  ${index + 1}. ${grade.name} - Cor: ${grade.color_name}`,
          );
          console.log(`     Total: ${grade.total_quantity} peças`);
          console.log(
            `     Estoque completo: ${grade.has_full_stock ? "SIM" : "NÃO"}`,
          );
        });

        console.log("\n💡 Agora na loja aparecerá:");
        console.log(
          "   ✅ 'Selecione a Grade' em vez de 'Selecione o Tamanho'",
        );
        console.log("   ✅ Duas opções de grade (uma para cada cor)");
        console.log("   ✅ Cada grade mostra os tamanhos e quantidades");
      } else {
        console.log(
          "❌ Ainda não há grades disponíveis - verificar condições da API",
        );
      }
    } else {
      console.log(`❌ Erro na API: ${response.status}`);
    }
  } catch (error) {
    console.error("❌ Erro ao corrigir quantidades:", error);
  }
}

fixGradeQuantities()
  .then(() => {
    console.log("🏁 Correção finalizada");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Erro fatal:", error);
    process.exit(1);
  });
