const axios = require("axios");

const testData = {
  produto: {
    codigo: "CHN001",
    nome: "Chinelo Havaianas Top",
    categoria: "Chinelos",
    tipo: "Casual",
    marca: "Havaianas",
    genero: "Unissex",
    descricao: "O chinelo mais famoso do Brasil",
    preco_sugerido: 39.9,
    vender_infinito: false,
    tipo_estoque: "grade",
  },
  variantes: [
    {
      cor: "Preto",
      preco: 29.9,
      foto: "https://exemplo.com/chinelo-preto.jpg",
      grades: {
        Infantil: 15,
        Adulto: 25,
      },
    },
    {
      cor: "Azul",
      preco: 32.9,
      foto: "https://exemplo.com/chinelo-azul.jpg",
      grades: {
        Infantil: 10,
        Adulto: 30,
      },
    },
  ],
};

async function testBulkAPI() {
  try {
    console.log("Testing new produto/variantes format...");
    console.log("Sending data:", JSON.stringify(testData, null, 2));

    const response = await axios.post(
      "http://localhost:3000/api/products/bulk",
      testData,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 30000,
      },
    );

    console.log("✅ Success!");
    console.log("Response status:", response.status);
    console.log("Response data:", JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log("❌ Error:");
    if (error.response) {
      console.log("Status:", error.response.status);
      console.log("Error data:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.log("Network/Other error:", error.message);
    }
  }
}

// Run test
testBulkAPI();
