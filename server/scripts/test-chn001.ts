import axios from "axios";

const API_BASE = "http://localhost:8080/api";
const API_KEY = "sk_live_abcd1234567890abcdef1234567890abcdef12";

async function testCHN001() {
  console.log("🧪 Testando produto CHN001...\n");

  const testData = {
    products: [
      {
        codigo: "CHN001",
        nome: "Chinelo Havaianas Top",
        categoria: "Chinelos",
        tipo: "Casual",
        genero: "Masculino",
        descricao: "O chinelo mais famoso do Brasil",
        variantes: [
          {
            cor: "Preto",
            preco: 29.90,
            grade: "Padrão",
            foto: "https://images.tcdn.com.br/img/img_prod/699671/chinelo_havaianas_top_masculino_preto_24851_1_da2ff112816d222cd40bc1e93a37953a_20250313182035.jpg"
          },
          {
            cor: "Azul Marinho",
            preco: 29.90,
            grade: "Padrão",
            foto: "https://static1.efacil.com.br/wcsstore/ExtendedSitesCatalogAssetStore/Imagens/360/1204119_01.jpg"
          }
        ]
      }
    ]
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

    // Testar se as variantes foram criadas
    console.log("\n📤 Verificando variantes criadas...");
    const variantsResponse = await axios.get(
      `${API_BASE}/products/CHN001/variants`,
    );
    console.log("✅ Variantes encontradas:");
    console.log(JSON.stringify(variantsResponse.data, null, 2));

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

testCHN001();
