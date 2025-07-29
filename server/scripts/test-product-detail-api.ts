async function testProductDetailAPI() {
  try {
    console.log("🔍 Testando API de detalhes do produto (ID: 150)...");

    // Testar endpoint de detalhes do produto
    const response = await fetch(
      "http://localhost:8080/api/store/products/150",
    );

    if (!response.ok) {
      console.log(`❌ Erro: ${response.status} - ${response.statusText}`);
      const errorText = await response.text();
      console.log(`Erro: ${errorText}`);
      return;
    }

    const product = await response.json();
    console.log("✅ Produto carregado com sucesso!");

    // Analisar estrutura do produto
    console.log("\n📦 Estrutura do produto:");
    console.log({
      id: product.id,
      name: product.name,
      sell_without_stock: product.sell_without_stock,
      variants_count: product.variants?.length || 0,
      available_grades_count: product.available_grades?.length || 0,
      available_colors_count: product.available_colors?.length || 0,
    });

    // Verificar cores disponíveis
    if (product.available_colors && product.available_colors.length > 0) {
      console.log("\n🎨 Cores disponíveis:");
      product.available_colors.forEach((color: any, index: number) => {
        console.log(
          `  ${index + 1}. ${color.name} (ID: ${color.id}) - Hex: ${color.hex_code}`,
        );
      });
    } else {
      console.log("\n❌ Nenhuma cor disponível!");
    }

    // Verificar variantes
    if (product.variants && product.variants.length > 0) {
      console.log("\n📐 Variantes disponíveis:");
      product.variants.forEach((variant: any, index: number) => {
        console.log(
          `  ${index + 1}. Cor: ${variant.color_name}, Tamanho: ${variant.size}, Estoque: ${variant.stock}`,
        );
      });
    } else {
      console.log("\n❌ Nenhuma variante disponível!");
    }

    // Verificar grades
    if (product.available_grades && product.available_grades.length > 0) {
      console.log("\n📊 Grades disponíveis:");
      product.available_grades.forEach((grade: any, index: number) => {
        console.log(
          `  ${index + 1}. ${grade.name} - Cor ID: ${grade.color_id}, Tem estoque completo: ${grade.has_full_stock}`,
        );
        if (grade.templates) {
          console.log(`     Templates: ${grade.templates.length} tamanhos`);
          grade.templates.forEach((template: any) => {
            console.log(
              `       - ${template.size}: ${template.required_quantity} peças`,
            );
          });
        }
      });
    } else {
      console.log("\n❌ Nenhuma grade disponível!");
    }

    // Análise específica para venda infinita
    console.log("\n🔄 Análise para venda infinita:");
    console.log(
      `- Produto permite venda sem estoque: ${product.sell_without_stock ? "SIM" : "NÃO"}`,
    );

    if (product.sell_without_stock) {
      console.log(
        "- ✅ Como tem venda infinita, DEVERIA mostrar todas as variantes/grades",
      );
      console.log("- ✅ Não deveria filtrar por estoque > 0");
    } else {
      console.log("- ⚠️ Sem venda infinita, só mostra com estoque > 0");
    }
  } catch (error) {
    console.error("❌ Erro no teste:", error);
  }
}

testProductDetailAPI()
  .then(() => {
    console.log("🏁 Teste finalizado");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Erro fatal:", error);
    process.exit(1);
  });
