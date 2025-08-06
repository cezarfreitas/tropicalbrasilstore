const mysql = require('mysql2/promise');

async function checkDatabase() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'calca_db',
      port: process.env.DB_PORT || 3306
    });

    console.log('🔗 Connected to database');

    // Check categories
    console.log('\n📂 CATEGORIAS:');
    const [categories] = await connection.execute('SELECT id, name FROM categories ORDER BY name');
    console.table(categories);

    // Check if specific categories exist
    const testCategories = ['Chinelos', 'Sandálias'];
    for (const catName of testCategories) {
      const [found] = await connection.execute('SELECT id, name FROM categories WHERE LOWER(name) = LOWER(?)', [catName]);
      console.log(`🔍 Categoria "${catName}": ${found.length > 0 ? `EXISTE (ID: ${found[0].id})` : 'NÃO EXISTE'}`);
    }

    // Check product_variants table structure
    console.log('\n🏗️ ESTRUTURA DA TABELA product_variants:');
    const [variantStructure] = await connection.execute('DESCRIBE product_variants');
    console.table(variantStructure);

    // Check for any existing variants
    console.log('\n📊 VARIANTES EXISTENTES:');
    const [existingVariants] = await connection.execute(`
      SELECT 
        pv.id, pv.product_id, p.name as product_name, 
        s.size, c.name as color_name, pv.stock
      FROM product_variants pv
      LEFT JOIN products p ON pv.product_id = p.id
      LEFT JOIN sizes s ON pv.size_id = s.id
      LEFT JOIN colors c ON pv.color_id = c.id
      ORDER BY pv.id DESC
      LIMIT 10
    `);
    console.table(existingVariants);

    // Check sizes
    console.log('\n📏 TAMANHOS DISPONÍVEIS:');
    const [sizes] = await connection.execute('SELECT id, size FROM sizes ORDER BY size');
    console.table(sizes);

    // Check if specific product exists
    const [testProduct] = await connection.execute('SELECT id, name, sku FROM products WHERE name LIKE ? OR sku LIKE ?', ['%Chinelo ABC%', '%ABC001%']);
    console.log('\n🔍 PRODUTO TESTE (Chinelo ABC):');
    console.table(testProduct);

    if (testProduct.length > 0) {
      const productId = testProduct[0].id;
      const [productVariants] = await connection.execute(`
        SELECT 
          pv.id, s.size, c.name as color_name, pv.stock, pv.image_url
        FROM product_variants pv
        LEFT JOIN sizes s ON pv.size_id = s.id
        LEFT JOIN colors c ON pv.color_id = c.id
        WHERE pv.product_id = ?
        ORDER BY s.size, c.name
      `, [productId]);
      
      console.log(`\n🎯 VARIANTES DO PRODUTO "${testProduct[0].name}" (ID: ${productId}):`);
      console.table(productVariants);
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkDatabase();
