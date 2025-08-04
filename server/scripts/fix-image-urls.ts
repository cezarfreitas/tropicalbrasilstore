import db from "../lib/db";
import { ensureFullImageUrl } from "../lib/image-uploader";

async function fixImageUrls() {
  try {
    console.log("🔧 Iniciando correção de URLs de imagens...");

    // Fix image URLs in products table
    console.log("📦 Atualizando imagens na tabela products...");
    const [products] = await db.execute(
      "SELECT id, photo FROM products WHERE photo IS NOT NULL",
    );

    let updatedProducts = 0;
    for (const product of products as any[]) {
      const fullUrl = ensureFullImageUrl(product.photo);
      if (fullUrl && fullUrl !== product.photo) {
        await db.execute("UPDATE products SET photo = ? WHERE id = ?", [
          fullUrl,
          product.id,
        ]);
        console.log(`✅ Produto ${product.id}: ${product.photo} → ${fullUrl}`);
        updatedProducts++;
      }
    }

    // Fix image URLs in product_color_variants table
    console.log("🎨 Atualizando imagens na tabela product_color_variants...");
    const [variants] = await db.execute(
      "SELECT id, image_url FROM product_color_variants WHERE image_url IS NOT NULL",
    );

    let updatedVariants = 0;
    for (const variant of variants as any[]) {
      const fullUrl = ensureFullImageUrl(variant.image_url);
      if (fullUrl && fullUrl !== variant.image_url) {
        await db.execute(
          "UPDATE product_color_variants SET image_url = ? WHERE id = ?",
          [fullUrl, variant.id],
        );
        console.log(
          `✅ Variante ${variant.id}: ${variant.image_url} → ${fullUrl}`,
        );
        updatedVariants++;
      }
    }

    // Fix image URLs in variant_images table if it exists
    try {
      console.log("🖼️ Atualizando imagens na tabela variant_images...");
      const [images] = await db.execute(
        "SELECT id, image_url FROM variant_images WHERE image_url IS NOT NULL",
      );

      let updatedImages = 0;
      for (const image of images as any[]) {
        const fullUrl = ensureFullImageUrl(image.image_url);
        if (fullUrl && fullUrl !== image.image_url) {
          await db.execute(
            "UPDATE variant_images SET image_url = ? WHERE id = ?",
            [fullUrl, image.id],
          );
          console.log(`✅ Imagem ${image.id}: ${image.image_url} → ${fullUrl}`);
          updatedImages++;
        }
      }
      console.log(
        `📊 Total de imagens atualizadas na variant_images: ${updatedImages}`,
      );
    } catch (error) {
      console.log("ℹ️ Tabela variant_images não existe ou não contém dados");
    }

    console.log(`📊 Resumo:`);
    console.log(`   • Produtos atualizados: ${updatedProducts}`);
    console.log(`   • Variantes atualizadas: ${updatedVariants}`);
    console.log("✅ Correção de URLs concluída!");
  } catch (error) {
    console.error("❌ Erro ao corrigir URLs:", error);
  } finally {
    process.exit(0);
  }
}

fixImageUrls();
