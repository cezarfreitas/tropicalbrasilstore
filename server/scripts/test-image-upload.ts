import axios from "axios";
import db from "../lib/db";

const API_BASE = "http://localhost:8080/api";
const API_KEY = "sk_live_abcd1234567890abcdef1234567890abcdef12";

async function testImageUpload() {
  console.log("🧪 Testando upload de imagens...\n");

  // Clean up first
  await db.execute('DELETE FROM products WHERE sku = "IMG001"');

  const testData = {
    products: [
      {
        codigo: "IMG001",
        nome: "Teste Upload de Imagem",
        categoria: "Chinelos",
        tipo: "Casual",
        genero: "Unissex",
        descricao: "Produto para testar upload de imagens",
        variantes: [
          {
            cor: "Azul",
            preco: 45.9,
            grade: "Padrão",
            foto: "https://images.tcdn.com.br/img/img_prod/699671/chinelo_havaianas_top_masculino_preto_24851_1_da2ff112816d222cd40bc1e93a37953a_20250313182035.jpg",
          },
          {
            cor: "Preto",
            preco: 45.9,
            grade: "Padrão",
            foto: "https://static1.efacil.com.br/wcsstore/ExtendedSitesCatalogAssetStore/Imagens/360/1204119_01.jpg",
          },
        ],
      },
    ],
  };

  try {
    console.log("📤 Criando produto com download de imagens...");

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

    // Verificar se as imagens foram salvas localmente
    console.log("\n🔍 Verificando imagens salvas...");

    const [productVariants] = await db.execute(`
      SELECT pcv.*, c.name as color_name 
      FROM product_color_variants pcv 
      JOIN colors c ON pcv.color_id = c.id
      JOIN products p ON pcv.product_id = p.id
      WHERE p.sku = 'IMG001'
    `);

    console.log("Variantes com imagens:");
    (productVariants as any[]).forEach((variant: any) => {
      console.log(`- ${variant.color_name}: ${variant.image_url}`);
    });

    // Verificar foto do produto principal
    const [product] = await db.execute(
      "SELECT photo FROM products WHERE sku = 'IMG001'",
    );
    console.log("Foto do produto principal:", (product as any[])[0]?.photo);

    // Testar endpoint WooCommerce
    console.log("\n📤 Testando endpoint /api/products-woocommerce...");

    const wooResponse = await axios.get(`${API_BASE}/products-woocommerce`);
    const img001Product = wooResponse.data.data.find(
      (p: any) => p.sku === "IMG001",
    );
    if (img001Product) {
      console.log("Produto IMG001 no WooCommerce:");
      console.log("- variant_count:", img001Product.variant_count);
      console.log("- available_colors:", img001Product.available_colors);
      console.log("- photo:", img001Product.photo);
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

testImageUpload();
