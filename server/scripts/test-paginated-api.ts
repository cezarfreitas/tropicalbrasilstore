import fetch from "node-fetch";

async function testPaginatedAPI() {
  try {
    console.log("🔍 Testando API /api/store/products-paginated...");

    const params = new URLSearchParams({
      page: "1",
      limit: "20",
      _t: Date.now().toString(),
    });

    const url = `http://localhost:8080/api/store/products-paginated?${params}`;
    console.log("URL:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    console.log("Status:", response.status);
    console.log("Headers:", Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log("Response Length:", responseText.length);

    if (response.ok) {
      try {
        const result = JSON.parse(responseText);
        console.log("✅ Sucesso:");
        console.log("- Produtos encontrados:", result.products?.length || 0);
        console.log("- Paginação:", result.pagination);

        if (result.products?.length > 0) {
          console.log("\n📦 Primeiro produto:");
          console.log(JSON.stringify(result.products[0], null, 2));
        }
      } catch (e) {
        console.log(
          "❌ Resposta não é JSON válido:",
          responseText.substring(0, 200),
        );
      }
    } else {
      console.log("❌ Erro:", response.status, responseText);
    }
  } catch (error) {
    console.error("❌ Erro na requisição:", error);
  }
}

testPaginatedAPI();
