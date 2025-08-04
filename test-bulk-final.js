#!/usr/bin/env node

const fs = require("fs");

// Test data from user exactly as provided
const testData = [
  {
    codigo: "TB1.2522",
    nome: "Logo",
    categoria: "Logo",
    tipo: "Sandália",
    genero: "Feminina",
    marca: "Tropical Brasil",
    descricao:
      "Chinelo Havaianas Top tradicional, confortável e durável. Material borracha de alta qualidade.",
    preco_sugerido: "",
    vender_infinito: true,
    tipo_estoque: "grade",
    variantes: [
      {
        cor: "Azul Elemental",
        preco: "R$ 13,60",
        grade: "2647, 2637",
        sku: "",
        estoque_grade: "",
        foto: "https://projetoinfluencer.vteximg.com.br/arquivos/ids/6371104-640-960/Chinelo-Tropical-Brasil-Todo-Dia-Branco-com-Preto.jpg",
      },
    ],
  },
  {
    codigo: "TB1.2523",
    nome: "Logo",
    categoria: "Logo",
    tipo: "Sandália",
    genero: "Feminina",
    marca: "Tropical Brasil",
    descricao:
      "Chinelo Havaianas Top tradicional, confortável e durável. Material borracha de alta qualidade.",
    preco_sugerido: "",
    vender_infinito: true,
    tipo_estoque: "grade",
    variantes: [
      {
        cor: "Lima",
        preco: "R$ 13,60",
        grade: "2647, 2637",
        sku: "",
        estoque_grade: "",
        foto: "https://projetoinfluencer.vteximg.com.br/arquivos/ids/6371104-640-960/Chinelo-Tropical-Brasil-Todo-Dia-Branco-com-Preto.jpg",
      },
    ],
  },
  {
    codigo: "TB1.2524",
    nome: "Logo",
    categoria: "Logo",
    tipo: "Sandália",
    genero: "Feminina",
    marca: "Tropical Brasil",
    descricao:
      "Chinelo Havaianas Top tradicional, confortável e durável. Material borracha de alta qualidade.",
    preco_sugerido: "",
    vender_infinito: true,
    tipo_estoque: "grade",
    variantes: [
      {
        cor: "Laranja/norse",
        preco: "R$ 13,60",
        grade: "2647, 2637",
        sku: "",
        estoque_grade: "",
        foto: "https://projetoinfluencer.vteximg.com.br/arquivos/ids/6371104-640-960/Chinelo-Tropical-Brasil-Todo-Dia-Branco-com-Preto.jpg",
      },
    ],
  },
];

async function testBulkAPI() {
  console.log("🧪 Testing bulk API with provided user data...");
  console.log(`📊 Testing ${testData.length} products`);

  try {
    const response = await fetch("http://localhost:5000/api/products/bulk", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ produtos: testData }),
    });

    console.log(`📈 Response status: ${response.status}`);
    console.log(
      `📋 Response headers:`,
      Object.fromEntries(response.headers.entries()),
    );

    const result = await response.text();
    console.log("📝 Response body:", result);

    if (response.ok) {
      console.log("✅ Bulk API test completed successfully!");
      try {
        const parsed = JSON.parse(result);
        console.log("📊 Parsed result:", JSON.stringify(parsed, null, 2));
      } catch (e) {
        console.log("⚠️ Response is not valid JSON");
      }
    } else {
      console.log("❌ Bulk API test failed");
    }
  } catch (error) {
    console.error("💥 Test failed with error:", error.message);
    console.error("🔍 Full error:", error);
  }
}

testBulkAPI();
