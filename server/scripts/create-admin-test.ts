import axios from "axios";
import db from "../lib/db";

const API_BASE = "http://localhost:8080/api";
const API_KEY = "sk_live_abcd1234567890abcdef1234567890abcdef12";

async function createProductForAdmin() {
  console.log("🧪 Criando produto para testar na interface admin...\n");

  const testData = {
    products: [
      {
        codigo: "ADMIN001",
        nome: "Chinelo Admin Test",
        categoria: "Chinelos",
        tipo: "Casual",
        genero: "Unissex",
        descricao: "Produto criado para testar interface admin",
        variantes: [
          {
            cor: "Vermelho",
            preco: 29.90,
            grade: "Padrão",
            foto: "https://example.com/vermelho.jpg"
          },
          {
            cor: "Azul",
            preco: 29.90,
            grade: "Padrão", 
            foto: "https://example.com/azul.jpg"
          }
        ]
      }
    ]
  };

  try {
    console.log("📤 Criando produto via API bulk...");
    
    const createResponse = await axios.post(`${API_BASE}/products/bulk`, testData, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
    });

    console.log("✅ Produto criado via API!");
    console.log("Resposta:", JSON.stringify(createResponse.data, null, 2));

    // Verificar se o produto aparece na lista de produtos (endpoint que o admin usa)
    console.log("\n📤 Testando endpoint /api/products que o admin usa...");
    
    const listResponse = await axios.get(`${API_BASE}/products`);
    console.log("✅ Produtos retornados pelo endpoint:", listResponse.data.length);
    
    if (listResponse.data.length > 0) {
      console.log("Primeiro produto:", JSON.stringify(listResponse.data[0], null, 2));
    }

    // Verificar diretamente no banco
    console.log("\n🔍 Verificação direta no banco de dados...");
    
    const [dbProducts] = await db.execute(
      "SELECT id, sku, name, base_price, active FROM products WHERE sku = 'ADMIN001'"
    );
    console.log("Produto no banco:", dbProducts);

    const [dbVariants] = await db.execute(`
      SELECT pv.id, c.name as cor, s.size, pv.price_override, pv.image_url
      FROM product_variants pv 
      JOIN colors c ON pv.color_id = c.id 
      JOIN sizes s ON pv.size_id = s.id
      JOIN products p ON pv.product_id = p.id
      WHERE p.sku = 'ADMIN001'
      ORDER BY c.name, s.display_order
    `);
    console.log("Variantes no banco:", dbVariants.length, "variantes");

    // Testar endpoint de variantes
    console.log("\n📤 Testando endpoint de variantes...");
    
    const variantsResponse = await axios.get(`${API_BASE}/products/ADMIN001/variants`);
    console.log("✅ Variantes retornadas:", variantsResponse.data.length);
    
    if (variantsResponse.data.length > 0) {
      console.log("Primeira variante:", JSON.stringify(variantsResponse.data[0], null, 2));
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

createProductForAdmin();
