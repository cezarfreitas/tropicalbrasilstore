import db from "../lib/db";

async function checkSellWithoutStock() {
  try {
    console.log("🔍 Verificando produtos com 'venda infinita sem estoque'...");

    // 1. Verificar se a coluna existe
    console.log("\n📋 Verificando estrutura da tabela products:");
    const [columns] = await db.execute('DESCRIBE products');
    const sellWithoutStockColumn = (columns as any[]).find(col => col.Field === 'sell_without_stock');
    
    if (sellWithoutStockColumn) {
      console.log("✅ Coluna 'sell_without_stock' existe na tabela products");
      console.log(`   Tipo: ${sellWithoutStockColumn.Type}, Default: ${sellWithoutStockColumn.Default}`);
    } else {
      console.log("❌ Coluna 'sell_without_stock' NÃO existe na tabela products");
      return;
    }

    // 2. Contar produtos com venda infinita
    console.log("\n📊 Contando produtos com venda infinita:");
    const [countResult] = await db.execute(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN sell_without_stock = 1 THEN 1 END) as with_infinite_sell,
        COUNT(CASE WHEN sell_without_stock = 0 OR sell_without_stock IS NULL THEN 1 END) as without_infinite_sell
      FROM products
    `);
    
    const stats = (countResult as any[])[0];
    console.table(stats);

    // 3. Listar produtos com venda infinita ativada
    if (stats.with_infinite_sell > 0) {
      console.log("\n📦 Produtos com venda infinita ativada:");
      const [productsWithInfinite] = await db.execute(`
        SELECT 
          id,
          name,
          sku,
          sell_without_stock,
          created_at,
          updated_at
        FROM products 
        WHERE sell_without_stock = 1
        ORDER BY created_at DESC
        LIMIT 10
      `);
      console.table(productsWithInfinite);
    } else {
      console.log("\n⚠️ Nenhum produto com venda infinita encontrado!");
    }

    // 4. Verificar alguns produtos recentes
    console.log("\n📋 Últimos produtos criados (para verificar configuração):");
    const [recentProducts] = await db.execute(`
      SELECT 
        id,
        name,
        sku,
        sell_without_stock,
        created_at
      FROM products 
      ORDER BY created_at DESC
      LIMIT 5
    `);
    console.table(recentProducts);

    // 5. Verificar se há produtos sendo exibidos na API da loja
    console.log("\n🏪 Testando API da loja...");
    try {
      const storeResponse = await fetch('http://localhost:8080/api/store/products');
      if (storeResponse.ok) {
        const storeProducts = await storeResponse.json();
        console.log(`✅ API da loja retorna ${storeProducts.length} produtos`);
        
        if (storeProducts.length > 0) {
          console.log("📋 Exemplo de produto da loja:");
          const sampleProduct = storeProducts[0];
          console.log({
            id: sampleProduct.id,
            name: sampleProduct.name,
            sell_without_stock: sampleProduct.sell_without_stock,
            price: sampleProduct.price
          });
        }
      } else {
        console.log(`❌ Erro na API da loja: ${storeResponse.status}`);
      }
    } catch (error) {
      console.log("❌ Erro ao testar API da loja:", error);
    }

  } catch (error) {
    console.error("❌ Erro ao verificar venda infinita:", error);
  }
}

// Executar
checkSellWithoutStock().then(() => {
  console.log("🏁 Verificação finalizada");
  process.exit(0);
}).catch((error) => {
  console.error("💥 Erro fatal:", error);
  process.exit(1);
});
