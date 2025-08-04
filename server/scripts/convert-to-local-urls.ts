import db from "../lib/db";
import { ensureLocalImageUrl } from "../lib/image-uploader";

async function convertToLocalUrls() {
  try {
    console.log("🔧 Convertendo URLs de imagens para locais...");

    // Fix image URLs in products table
    console.log("📦 Convertendo imagens na tabela products...");
    const [products] = await db.execute("SELECT id, photo FROM products WHERE photo IS NOT NULL");

    let updatedProducts = 0;
    for (const product of products as any[]) {
      const localUrl = ensureLocalImageUrl(product.photo);
      if (localUrl && localUrl !== product.photo) {
        await db.execute("UPDATE products SET photo = ? WHERE id = ?", [localUrl, product.id]);
        console.log(`✅ Produto ${product.id}: ${product.photo} → ${localUrl}`);
        updatedProducts++;
      }
    }

    // Fix image URLs in product_color_variants table
    console.log("🎨 Convertendo imagens na tabela product_color_variants...");
    const [variants] = await db.execute("SELECT id, image_url FROM product_color_variants WHERE image_url IS NOT NULL");

    let updatedVariants = 0;
    for (const variant of variants as any[]) {
      const localUrl = ensureLocalImageUrl(variant.image_url);
      if (localUrl && localUrl !== variant.image_url) {
        await db.execute("UPDATE product_color_variants SET image_url = ? WHERE id = ?", [localUrl, variant.id]);
        console.log(`✅ Variante ${variant.id}: ${variant.image_url} → ${localUrl}`);
        updatedVariants++;
      }
    }

    // Fix image URLs in variant_images table if it exists
    try {
      console.log("🖼️ Convertendo imagens na tabela variant_images...");
      const [images] = await db.execute("SELECT id, image_url FROM variant_images WHERE image_url IS NOT NULL");

      let updatedImages = 0;
      for (const image of images as any[]) {
        const localUrl = ensureLocalImageUrl(image.image_url);
        if (localUrl && localUrl !== image.image_url) {
          await db.execute("UPDATE variant_images SET image_url = ? WHERE id = ?", [localUrl, image.id]);
          console.log(`✅ Imagem ${image.id}: ${image.image_url} → ${localUrl}`);
          updatedImages++;
        }
      }
      console.log(`📊 Total de imagens atualizadas na variant_images: ${updatedImages}`);
    } catch (error) {
      console.log("ℹ️ Tabela variant_images não existe ou não contém dados");
    }

    console.log(`📊 Resumo:`);
    console.log(`   • Produtos atualizados: ${updatedProducts}`);
    console.log(`   • Variantes atualizadas: ${updatedVariants}`);
    console.log("✅ Conversão para URLs locais concluída!");

  } catch (error) {
    console.error("❌ Erro ao converter URLs:", error);
  } finally {
    process.exit(0);
  }
}

convertToLocalUrls();
