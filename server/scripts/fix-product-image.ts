import db from "../lib/db";

async function fixProductImage() {
  try {
    console.log("🔍 Corrigindo caminho da imagem do produto...");

    // Verificar imagem atual
    const [currentProduct] = await db.execute(
      "SELECT id, name, photo FROM products WHERE id = 150",
    );

    console.log("📷 Imagem atual:", (currentProduct as any[])[0]);

    // Atualizar para a imagem mais recente
    const newImagePath = "/uploads/products/chn001-preto-1753802449131.jpg";

    await db.execute("UPDATE products SET photo = ? WHERE id = 150", [
      newImagePath,
    ]);

    console.log(`✅ Imagem atualizada para: ${newImagePath}`);

    // Verificar resultado
    const [updatedProduct] = await db.execute(
      "SELECT id, name, photo FROM products WHERE id = 150",
    );

    console.log("📷 Imagem após atualização:", (updatedProduct as any[])[0]);
  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await db.end();
  }
}

fixProductImage();
