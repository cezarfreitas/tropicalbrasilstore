import axios from "axios";
import db from "../lib/db";

const API_BASE = "http://localhost:8080/api";
const API_KEY = "sk_live_abcd1234567890abcdef1234567890abcdef12";

async function testWooCommerceFix() {
  console.log("🧪 Testando correção para interface WooCommerce...\n");

  const testData = {
    products: [
      {
        codigo: "ADMIN002",
        nome: "Teste WooCommerce Fix",
        categoria: "Chinelos",
        tipo: "Casual",
        genero: "Unissex",
        descricao: "Produto para testar correção WooCommerce",
        variantes: [
          {
            cor: "Vermelho",
            preco: 35.9,
            grade: "Padrão",
            foto: "https://example.com/vermelho.jpg",
          },
          {
            cor: "Verde",
            preco: 35.9,
            grade: "Padr��o",
            foto: "https://example.com/verde.jpg",
          },
        ],
      },
    ],
  };

  try {
    console.log("📤 Criando produto via API bulk...");

    const createResponse = await axios.post(
      `${API_BASE}/products/bulk`,
      testData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
      },
    );

    console.log("✅ Produto criado!");
    console.log("Resposta:", JSON.stringify(createResponse.data, null, 2));

    // Testar endpoint WooCommerce
    console.log("\n📤 Testando endpoint /api/products-woocommerce...");

    const wooResponse = await axios.get(`${API_BASE}/products-woocommerce`);
    console.log("✅ Produtos WooCommerce:", wooResponse.data.data.length);

    if (wooResponse.data.data.length > 0) {
      const product = wooResponse.data.data.find(
        (p: any) => p.sku === "ADMIN002",
      );
      if (product) {
        console.log("Produto ADMIN002 encontrado:");
        console.log("- variant_count:", product.variant_count);
        console.log("- available_colors:", product.available_colors);
        console.log("- total_stock:", product.total_stock);
      }
    }

    // Verificar diretamente as tabelas
    console.log("\n🔍 Verificação nas tabelas...");

    const [productColorVariants] = await db.execute(
      `SELECT pcv.*, c.name as color_name 
       FROM product_color_variants pcv 
       JOIN colors c ON pcv.color_id = c.id
       JOIN products p ON pcv.product_id = p.id
       WHERE p.sku = 'ADMIN002'`,
    );
    console.log(
      "product_color_variants criadas:",
      (productColorVariants as any[]).length,
    );
    if ((productColorVariants as any[]).length > 0) {
      console.log("Primeira entrada:", (productColorVariants as any[])[0]);
    }

    const [productVariants] = await db.execute(
      `SELECT COUNT(*) as count
       FROM product_variants pv 
       JOIN products p ON pv.product_id = p.id
       WHERE p.sku = 'ADMIN002'`,
    );
    console.log(
      "product_variants criadas:",
      (productVariants as any[])[0].count,
    );
  } catch (error: any) {
    console.log("❌ Erro:", error.message);
    if (error.response) {
      console.log("Status:", error.response.status);
      console.log("Dados:", JSON.stringify(error.response.data, null, 2));
    }
  }

  process.exit(0);
}

testWooCommerceFix();
