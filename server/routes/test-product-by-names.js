// Exemplo prático de uso da API /api/products-by-names
// Execute este script com: node test-product-by-names.js

const produtoExemplo = {
  name: "Chinelo Havaianas Top Premium",
  description:
    "Chinelo clássico Havaianas com solado resistente e confortável, ideal para uso no dia a dia. Material de alta qualidade com acabamento premium.",
  category_name: "Calçados Femininos",
  base_price: 18.5,
  sale_price: 32.9,
  suggested_price: 45.0,
  sku: "HAV-TOP-PREM",
  parent_sku: "HAV-TOP",
  photo_url:
    "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=500", // Imagem será baixada automaticamente
  size_group_name: "Feminino Adulto",
  variants: [
    {
      size_name: "35",
      color_name: "Rosa Coral",
      stock: 25,
    },
    {
      size_name: "36",
      color_name: "Rosa Coral",
      stock: 30,
    },
    {
      size_name: "37",
      color_name: "Rosa Coral",
      stock: 40,
    },
    {
      size_name: "38",
      color_name: "Rosa Coral",
      stock: 35,
    },
    {
      size_name: "39",
      color_name: "Rosa Coral",
      stock: 20,
    },
    {
      size_name: "35",
      color_name: "Azul Marinho",
      stock: 30,
    },
    {
      size_name: "36",
      color_name: "Azul Marinho",
      stock: 35,
    },
    {
      size_name: "37",
      color_name: "Azul Marinho",
      stock: 45,
    },
    {
      size_name: "38",
      color_name: "Azul Marinho",
      stock: 40,
    },
    {
      size_name: "39",
      color_name: "Azul Marinho",
      stock: 25,
    },
  ],
};

// Função para testar a API
async function testarAPI() {
  try {
    const response = await fetch(
      "http://localhost:8080/api/products-by-names",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(produtoExemplo),
      },
    );

    const resultado = await response.json();

    if (response.ok) {
      console.log("✅ Produto criado com sucesso!");
      console.log("📦 Produto:", resultado.product.name);
      console.log("🆔 ID:", resultado.product.id);
      console.log(
        "📂 Categoria criada:",
        resultado.created_resources.category_created,
      );
      console.log(
        "🎨 Cores criadas:",
        resultado.created_resources.colors_created,
      );
      console.log(
        "📏 Tamanhos criados:",
        resultado.created_resources.sizes_created,
      );
      console.log(
        "📸 Foto baixada:",
        resultado.created_resources.photo_downloaded,
      );
      console.log(
        "🔗 URL original:",
        resultado.created_resources.photo_url_original,
      );
      console.log(
        "💾 Caminho salvo:",
        resultado.created_resources.photo_path_saved,
      );
      console.log("📊 Total de variantes:", resultado.product.variant_count);
      console.log("📦 Estoque total:", resultado.product.total_stock);
    } else {
      console.error("❌ Erro:", resultado.error);
    }
  } catch (error) {
    console.error("❌ Erro de conexão:", error.message);
  }
}

// Instruções de uso
console.log(`
🚀 API de Produtos por Nomes - Teste

Para testar esta API:

1. Certifique-se que o servidor está rodando em http://localhost:8080
2. Execute este arquivo ou use o exemplo abaixo:

const produto = ${JSON.stringify(produtoExemplo, null, 2)};

fetch('/api/products-by-names', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(produto)
});

✨ Funcionalidades automáticas:
- ✅ Cria categoria "Calçados Femininos" se não existir
- ✅ Cria cores "Rosa Coral" e "Azul Marinho" se não existirem  
- ✅ Cria tamanhos 35-39 se não existirem
- ✅ Cria grupo "Feminino Adulto" se não existir
- ✅ Baixa a imagem do Unsplash e salva localmente
- ✅ Cria 10 variantes (2 cores x 5 tamanhos)
- ✅ Define estoque individual para cada variante

🔗 Endpoints disponíveis:
- POST /api/products-by-names (esta API)
- GET /api/products-enhanced (listar produtos)
- PUT /api/products-enhanced/:id (atualizar)
- DELETE /api/products-enhanced/:id (excluir)
`);

// Descomente a linha abaixo para executar o teste automaticamente
// testarAPI();
