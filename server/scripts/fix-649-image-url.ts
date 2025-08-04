import db from "../lib/db";

async function fixImageUrl() {
  try {
    console.log("🔧 Corrigindo URL da imagem do produto 649...");
    
    const correctUrl = 'https://b2b.tropicalbrasilsandalias.com.br/uploads/products/product-1754273096747-655259694.png';
    
    // Update product_color_variants
    await db.execute(
      'UPDATE product_color_variants SET image_url = ? WHERE product_id = 649',
      [correctUrl]
    );
    
    console.log(`✅ URL atualizada para: ${correctUrl}`);
    
    // Verify the update
    const [result] = await db.execute(
      'SELECT image_url FROM product_color_variants WHERE product_id = 649'
    );
    
    console.log('📋 Verificação:', (result as any[])[0]);
    
  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    process.exit(0);
  }
}

fixImageUrl();
