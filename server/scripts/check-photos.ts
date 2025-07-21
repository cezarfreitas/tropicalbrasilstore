import db from "../lib/db";

async function checkPhotos() {
  try {
    const [result] = await db.execute(
      "SELECT id, name, photo FROM products WHERE photo IS NOT NULL LIMIT 10",
    );
    console.log("Produtos com fotos:");
    console.table(result);

    // Test if photos are being returned in API
    const [apiResult] = await db.execute(`
      SELECT p.id, p.name, p.photo, p.base_price
      FROM products p 
      WHERE p.photo IS NOT NULL 
      ORDER BY p.id DESC 
      LIMIT 5
    `);
    console.log("\nDados para API:");
    console.table(apiResult);

    process.exit(0);
  } catch (error) {
    console.error("Erro:", error);
    process.exit(1);
  }
}

checkPhotos();
