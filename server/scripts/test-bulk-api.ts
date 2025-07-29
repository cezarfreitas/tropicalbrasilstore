import axios from "axios";

const API_BASE = "http://localhost:8080/api";
const API_KEY = "sk_live_abcd1234567890abcdef1234567890abcdef12";

async function testBulkAPI() {
  console.log("🧪 Testando API de Bulk Products...\n");

  const testData = {
    products: [
      {
        codigo: "TEST001",
        nome: "Chinelo Teste 1",
        categoria: "Chinelos",
        tipo: "Casual",
        genero: "Unissex",
        descricao: "Produto de teste da API",
        vender_infinito: true,
        variantes: [
          {
            cor: "Preto",
            preco: 29.9,
            grade: "Grade Unissex",
            foto: "https://exemplo.com/chinelo-preto.jpg",
          },
          {
            cor: "Azul",
            preco: 29.9,
            grade: "Grade Unissex",
            foto: "https://exemplo.com/chinelo-azul.jpg",
          },
        ],
      },
      {
        codigo: "TEST002",
        nome: "Sandália Teste",
        categoria: "Sandálias",
        tipo: "Sandália",
        genero: "Feminino",
        descricao: "Sandália de teste",
        vender_infinito: false,
        variantes: [
          {
            cor: "Rosa",
            preco: 89.9,
            grade: "Grade Feminina",
          },
        ],
      },
    ],
  };

  try {
    console.log("📤 Enviando requisição para /api/products/bulk...");
    const response = await axios.post(`${API_BASE}/products/bulk`, testData, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
    });

    console.log("✅ Sucesso!");
    console.log("Status:", response.status);
    console.log("Resposta:", JSON.stringify(response.data, null, 2));

    // Testar listagem de variantes
    console.log("\n📤 Testando listagem de variantes...");
    const variantsResponse = await axios.get(
      `${API_BASE}/products/TEST001/variants`,
    );
    console.log("✅ Variantes encontradas:");
    console.log(JSON.stringify(variantsResponse.data, null, 2));
  } catch (error: any) {
    console.log("�� Erro na requisição:");
    if (error.response) {
      console.log("Status:", error.response.status);
      console.log("Dados:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.log("Erro:", error.message);
    }
  }
}

async function testSingleAPI() {
  console.log("\n🧪 Testando API de Single Product...\n");

  const testData = {
    codigo: "SINGLE001",
    nome: "Produto Individual",
    categoria: "Tênis",
    tipo: "Esportivo",
    genero: "Masculino",
    descricao: "Produto criado individualmente",
    cor: "Branco",
    preco: 149.9,
    grade: "Grade Esportiva",
    foto: "https://exemplo.com/tenis-branco.jpg",
    vender_infinito: true,
  };

  try {
    console.log("📤 Enviando requisição para /api/products/single...");
    const response = await axios.post(`${API_BASE}/products/single`, testData, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
    });

    console.log("✅ Sucesso!");
    console.log("Status:", response.status);
    console.log("Resposta:", JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    console.log("❌ Erro na requisição:");
    if (error.response) {
      console.log("Status:", error.response.status);
      console.log("Dados:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.log("Erro:", error.message);
    }
  }
}

// Executar testes
testBulkAPI().then(() => {
  testSingleAPI();
});
