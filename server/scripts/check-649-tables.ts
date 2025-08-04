import db from "../lib/db";

async function checkTables() {
  try {
    console.log('🔍 Verificando tabelas para produto 649...\n');
    
    // Check product_variants
    const [pv] = await db.execute('SELECT COUNT(*) as count FROM product_variants WHERE product_id = 649');
    console.log(`📋 product_variants: ${(pv as any[])[0].count} registros`);
    
    if ((pv as any[])[0].count > 0) {
      const [pvDetails] = await db.execute(`
        SELECT pv.id, pv.color_id, pv.size_id, pv.stock, pv.image_url, 
               c.name as color_name, s.size
        FROM product_variants pv
        LEFT JOIN colors c ON pv.color_id = c.id  
        LEFT JOIN sizes s ON pv.size_id = s.id
        WHERE pv.product_id = 649
      `);
      console.log('   Detalhes:', pvDetails);
    }
    
    // Check product_color_variants  
    const [pcv] = await db.execute('SELECT COUNT(*) as count FROM product_color_variants WHERE product_id = 649');
    console.log(`\n🎨 product_color_variants: ${(pcv as any[])[0].count} registros`);
    
    if ((pcv as any[])[0].count > 0) {
      const [pcvDetails] = await db.execute(`
        SELECT pcv.id, pcv.variant_name, pcv.image_url, pcv.active, pcv.color_id,
               c.name as color_name
        FROM product_color_variants pcv
        LEFT JOIN colors c ON pcv.color_id = c.id
        WHERE pcv.product_id = 649
      `);
      console.log('   Detalhes:', pcvDetails);
    }
    
    // Check product_color_grades
    const [pcg] = await db.execute('SELECT COUNT(*) as count FROM product_color_grades WHERE product_id = 649');
    console.log(`\n📊 product_color_grades: ${(pcg as any[])[0].count} registros`);
    
    if ((pcg as any[])[0].count > 0) {
      const [pcgDetails] = await db.execute(`
        SELECT pcg.*, c.name as color_name, g.name as grade_name
        FROM product_color_grades pcg
        LEFT JOIN colors c ON pcg.color_id = c.id
        LEFT JOIN grade_vendida g ON pcg.grade_id = g.id
        WHERE pcg.product_id = 649
      `);
      console.log('   Detalhes:', pcgDetails);
    }
    
    console.log('\n💡 Análise:');
    console.log('   - product_variants: Variantes físicas individuais (produto+cor+tamanho)');
    console.log('   - product_color_variants: Variantes de cor com imagens (produto+cor)');
    console.log('   - product_color_grades: Relação produto+cor+grade');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    process.exit(0);
  }
}

checkTables();
