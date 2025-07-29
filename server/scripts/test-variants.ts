import axios from "axios";
import db from "../lib/db";

const API_BASE = "http://localhost:8080/api";
const API_KEY = "sk_live_abcd1234567890abcdef1234567890abcdef12";

async function testVariants() {
  console.log("🧪 Testando criação de variantes...\n");

  const testData = {
    products: [
      {
        codigo: "TEST999",
        nome: "Produto Teste Variantes",
        categoria: "Teste",
        tipo: "Casual",
        genero: "Unissex",
        descricao: "Produto para testar variantes",
        variantes: [
          {
            cor: "Vermelho",
            preco: 39.9,
            grade: "Grade Teste",
            foto: "https://exemplo.com/vermelho.jpg",
          },
        ],
      },
    ],
  };

  try {
    console.log("📤 Criando produto via API...");

    const response = await axios.post(`${API_BASE}/products/bulk`, testData, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
    });

    console.log("✅ Produto criado!");
    console.log("Resposta API:", JSON.stringify(response.data, null, 2));

    // Verificar diretamente no banco
    console.log("\n🔍 Verificando no banco de dados...");

    const [products] = await db.execute(
      "SELECT id, name, base_price, photo FROM products WHERE sku = ?",
      ["TEST999"],
    );

    console.log("Produto no banco:", products);

    if ((products as any[]).length > 0) {
      const productId = (products as any[])[0].id;

      // Contar variantes
      const [variantCount] = await db.execute(
        "SELECT COUNT(*) as count FROM product_variants WHERE product_id = ?",
        [productId],
      );
      console.log("Total de variantes:", (variantCount as any[])[0].count);

      // Listar algumas variantes
      const [variants] = await db.execute(
        `SELECT pv.id, pv.price_override, pv.image_url, 
                c.name as color, s.size 
         FROM product_variants pv 
         JOIN colors c ON pv.color_id = c.id 
         JOIN sizes s ON pv.size_id = s.id 
         WHERE pv.product_id = ? 
         LIMIT 5`,
        [productId],
      );
      console.log("Primeiras 5 variantes:", variants);

      // Verificar a grade criada
      const [gradeInfo] = await db.execute(
        `SELECT g.id, g.name, COUNT(gt.id) as size_count
         FROM grade_vendida g
         LEFT JOIN grade_templates gt ON g.id = gt.grade_id
         WHERE g.name = 'Grade Teste'
         GROUP BY g.id, g.name`,
        [],
      );
      console.log("Info da Grade Teste:", gradeInfo);
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

testVariants();
