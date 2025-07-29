import axios from "axios";

const API_BASE = "http://localhost:8080/api";
const API_KEY = "sk_live_abcd1234567890abcdef1234567890abcdef12";

async function testSimple() {
  console.log("🧪 Teste simples de variantes incrementais...\n");

  // 1. Primeira requisição - criar produto
  console.log("📤 1. Criando produto com variante Azul...");

  const request1 = {
    products: [
      {
        codigo: "TEST123",
        nome: "Produto Teste Incremental",
        categoria: "Teste",
        tipo: "Casual",
        variantes: [
          {
            cor: "Azul",
            preco: 29.9,
            grade: "Padrão",
          },
        ],
      },
    ],
  };

  try {
    const response1 = await axios.post(`${API_BASE}/products/bulk`, request1, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
    });

    console.log("✅ Resposta 1:", {
      produtos_novos: response1.data.data.produtos_novos,
      variantes_novas: response1.data.data.variantes_novas,
      message: response1.data.message,
    });

    // 2. Segunda requisição - adicionar variante
    console.log("\n📤 2. Adicionando variante Vermelho ao mesmo produto...");

    const request2 = {
      products: [
        {
          codigo: "TEST123", // Mesmo código
          variantes: [
            {
              cor: "Vermelho",
              preco: 32.9,
              grade: "Padrão",
            },
          ],
        },
      ],
    };

    const response2 = await axios.post(`${API_BASE}/products/bulk`, request2, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
    });

    console.log("✅ Resposta 2:", {
      produtos_novos: response2.data.data.produtos_novos,
      produtos_atualizados: response2.data.data.produtos_atualizados,
      variantes_novas: response2.data.data.variantes_novas,
      variantes_existentes: response2.data.data.variantes_existentes,
      message: response2.data.message,
    });
  } catch (error: any) {
    console.log("❌ Erro:", error.message);
    if (error.response) {
      console.log("Dados:", error.response.data);
    }
  }

  process.exit(0);
}

testSimple();
