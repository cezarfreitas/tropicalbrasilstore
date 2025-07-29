import db from "../lib/db";

async function addSizeStock() {
  try {
    console.log("📦 Adicionando estoque por tamanho ao produto TEN001...");
    
    // Verificar se o produto existe e seu tipo de estoque
    const [product] = await db.execute(
      "SELECT id, name, stock_type FROM products WHERE sku = 'TEN001'"
    );
    
    if ((product as any[]).length === 0) {
      console.log("❌ Produto TEN001 não encontrado");
      return;
    }
    
    const productData = (product as any[])[0];
    console.log("✅ Produto encontrado:", productData);
    
    // Verificar variantes existentes
    const [variants] = await db.execute(
      `SELECT pv.*, s.size, c.name as color_name 
       FROM product_variants pv
       LEFT JOIN sizes s ON pv.size_id = s.id
       LEFT JOIN colors c ON pv.color_id = c.id
       WHERE pv.product_id = ?`,
      [productData.id]
    );
    
    console.log(`\n📊 Variantes encontradas: ${(variants as any[]).length}`);
    console.table(variants);
    
    // Adicionar estoque para alguns tamanhos
    const stockUpdates = [
      { size: 35, stock: 5 },
      { size: 36, stock: 8 },
      { size: 37, stock: 12 },
      { size: 38, stock: 10 },
      { size: 39, stock: 15 },
      { size: 40, stock: 12 },
      { size: 41, stock: 8 },
      { size: 42, stock: 5 },
    ];
    
    console.log("\n🔄 Atualizando estoque...");
    
    for (const update of stockUpdates) {
      // Atualizar estoque para ambas as cores (branco e preto)
      const [updateResult] = await db.execute(
        `UPDATE product_variants pv
         INNER JOIN sizes s ON pv.size_id = s.id
         SET pv.stock = ?
         WHERE pv.product_id = ? AND s.size = ?`,
        [update.stock, productData.id, update.size]
      );
      
      console.log(`✅ Tamanho ${update.size}: ${update.stock} unidades - ${(updateResult as any).affectedRows} variantes atualizadas`);
    }
    
    // Verificar resultado final
    const [finalStock] = await db.execute(
      `SELECT 
         s.size,
         c.name as color_name,
         pv.stock
       FROM product_variants pv
       INNER JOIN sizes s ON pv.size_id = s.id
       INNER JOIN colors c ON pv.color_id = c.id
       WHERE pv.product_id = ?
       ORDER BY s.display_order, c.name`,
      [productData.id]
    );
    
    console.log("\n📊 Estoque final por tamanho:");
    console.table(finalStock);
    
    // Verificar total de estoque
    const [totalStock] = await db.execute(
      "SELECT SUM(stock) as total FROM product_variants WHERE product_id = ?",
      [productData.id]
    );
    
    console.log(`\n📈 Total em estoque: ${(totalStock as any[])[0].total} unidades`);
    
  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await db.end();
  }
}

addSizeStock();
