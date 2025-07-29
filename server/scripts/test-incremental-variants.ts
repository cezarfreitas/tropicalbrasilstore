import axios from "axios";
import db from "../lib/db";

const API_BASE = "http://localhost:8080/api";
const API_KEY = "sk_live_abcd1234567890abcdef1234567890abcdef12";

async function testIncrementalVariants() {
  console.log("🧪 Testando criação incremental de variantes...\n");

  // Limpar produtos de teste
  await db.execute('DELETE FROM products WHERE sku = "INC001"');

  // 1. Primeira requisição - criar produto com primeira variante
  console.log("📤 1. Criando produto com primeira variante (Azul)...");

  const firstRequest = {
    products: [
      {
        codigo: "INC001",
        nome: "Chinelo Incremental Test",
        categoria: "Chinelos",
        tipo: "Casual",
        genero: "Unissex",
        descricao: "Produto para testar criação incremental de variantes",
        vender_infinito: true,
        variantes: [
          {
            cor: "Azul",
            preco: 39.9,
            grade: "Padrão",
            foto: "https://example.com/azul.jpg",
          },
        ],
      },
    ],
  };

  try {
    const response1 = await axios.post(
      `${API_BASE}/products/bulk`,
      firstRequest,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
      },
    );

    console.log("✅ Primeira requisição:");
    console.log("- Produtos novos:", response1.data.data.produtos_novos);
    console.log("- Variantes novas:", response1.data.data.variantes_novas);
    console.log("");

    // 2. Segunda requisição - adicionar variante vermelha ao mesmo produto
    console.log("📤 2. Adicionando variante Vermelha ao produto existente...");

    const secondRequest = {
      products: [
        {
          codigo: "INC001", // Mesmo código
          nome: "Chinelo Incremental Test",
          categoria: "Chinelos",
          tipo: "Casual",
          variantes: [
            {
              cor: "Vermelho",
              preco: 42.9,
              grade: "Padrão",
              foto: "https://example.com/vermelho.jpg",
            },
          ],
        },
      ],
    };

    const response2 = await axios.post(
      `${API_BASE}/products/bulk`,
      secondRequest,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
      },
    );

    console.log("✅ Segunda requisição:");
    console.log("- Produtos novos:", response2.data.data.produtos_novos);
    console.log(
      "- Produtos atualizados:",
      response2.data.data.produtos_atualizados,
    );
    console.log("- Variantes novas:", response2.data.data.variantes_novas);
    console.log(
      "- Variantes existentes:",
      response2.data.data.variantes_existentes,
    );
    console.log("");

    // 3. Terceira requisição - tentar adicionar variante azul novamente (deve detectar existente)
    console.log(
      "📤 3. Tentando adicionar variante Azul novamente (deve detectar existente)...",
    );

    const thirdRequest = {
      products: [
        {
          codigo: "INC001",
          variantes: [
            {
              cor: "Azul", // Cor que já existe
              preco: 39.9,
              grade: "Padrão",
            },
          ],
        },
      ],
    };

    const response3 = await axios.post(
      `${API_BASE}/products/bulk`,
      thirdRequest,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
      },
    );

    console.log("✅ Terceira requisição:");
    console.log(
      "- Produtos atualizados:",
      response3.data.data.produtos_atualizados,
    );
    console.log("- Variantes novas:", response3.data.data.variantes_novas);
    console.log(
      "- Variantes existentes:",
      response3.data.data.variantes_existentes,
    );
    console.log("");

    // 4. Verificar estado final do produto
    console.log("🔍 Estado final do produto:");

    const [productVariants] = await db.execute(`
      SELECT pcv.*, c.name as color_name 
      FROM product_color_variants pcv 
      JOIN colors c ON pcv.color_id = c.id
      JOIN products p ON pcv.product_id = p.id
      WHERE p.sku = 'INC001'
      ORDER BY c.name
    `);

    console.log(
      "Total de variantes de cor:",
      (productVariants as any[]).length,
    );
    (productVariants as any[]).forEach((variant: any) => {
      console.log(`- ${variant.color_name}: R$ ${variant.price}`);
    });

    // Testar endpoint WooCommerce
    console.log("\n📤 Verificando no endpoint WooCommerce...");
    const wooResponse = await axios.get(`${API_BASE}/products-woocommerce`);
    const incProduct = wooResponse.data.data.find(
      (p: any) => p.sku === "INC001",
    );
    if (incProduct) {
      console.log("- Variantes encontradas:", incProduct.variant_count);
      console.log("- Cores disponíveis:", incProduct.available_colors);
    }
  } catch (error: any) {
    console.log("❌ Erro:", error.message);
    if (error.response) {
      console.log("Status:", error.response.status);
      console.log("Dados:", JSON.stringify(error.response.data, null, 2));
    }
  }

  process.exit(0);
}

testIncrementalVariants();
