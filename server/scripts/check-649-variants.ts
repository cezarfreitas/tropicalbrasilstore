import db from "../lib/db";

async function check649Variants() {
  try {
    console.log('🔍 Checking product 649 color variants...');
    
    const [colorRows] = await db.execute(`
      SELECT DISTINCT
        co.id,
        co.name,
        co.hex_code,
        pcv.image_url
      FROM product_color_grades pcg
      LEFT JOIN colors co ON pcg.color_id = co.id
      LEFT JOIN product_color_variants pcv ON pcg.product_id = pcv.product_id AND pcg.color_id = pcv.color_id
      WHERE pcg.product_id = 649 AND co.id IS NOT NULL
      GROUP BY co.id, co.name, co.hex_code, pcv.image_url
      ORDER BY co.name
    `);
    
    console.log('Color variants data:', colorRows);
    console.log('Count:', (colorRows as any[]).length);
    
    // Also check raw data
    const [rawData] = await db.execute(`
      SELECT 
        p.id as product_id,
        p.name as product_name,
        p.photo as product_photo,
        pcv.id as variant_id,
        pcv.variant_name,
        pcv.image_url,
        c.name as color_name
      FROM products p
      LEFT JOIN product_color_variants pcv ON p.id = pcv.product_id
      LEFT JOIN colors c ON pcv.color_id = c.id
      WHERE p.id = 649
    `);
    
    console.log('\nRaw product data:', rawData);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

check649Variants();
