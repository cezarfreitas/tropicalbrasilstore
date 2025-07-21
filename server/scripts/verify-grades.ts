import db from "../lib/db";

async function verifyGrades() {
  try {
    console.log("🔍 Verificando grades do sistema...");

    // Count grades
    const [gradesResult] = await db.execute('SELECT COUNT(*) as count FROM grade_vendida');
    const gradesCount = (gradesResult as any)[0].count;
    console.log(`📊 Total de grades: ${gradesCount}`);

    // List all grades
    console.log("\n📋 Grades disponíveis:");
    const [grades] = await db.execute(`
      SELECT id, name, description, active 
      FROM grade_vendida 
      ORDER BY id
    `);
    console.table(grades);

    // Check grade templates
    console.log("\n🔧 Templates das grades:");
    const [templates] = await db.execute(`
      SELECT 
        g.name as grade_name, 
        s.size, 
        gt.required_quantity,
        COUNT(*) OVER (PARTITION BY g.id) as template_count
      FROM grade_templates gt
      JOIN grade_vendida g ON gt.grade_id = g.id
      JOIN sizes s ON gt.size_id = s.id
      ORDER BY g.id, s.display_order
    `);
    console.table(templates);

    // Check how many products have grades
    console.log("\n🔗 Produtos com grades por cor:");
    const [productGrades] = await db.execute(`
      SELECT 
        COUNT(DISTINCT pcg.product_id) as products_with_grades,
        COUNT(DISTINCT pcg.color_id) as colors_used,
        COUNT(*) as total_associations
      FROM product_color_grades pcg
    `);
    console.table(productGrades);

    // Sample product-grade associations
    console.log("\n📋 Exemplo de produtos com grades:");
    const [sampleAssociations] = await db.execute(`
      SELECT 
        p.name as product_name,
        c.name as color_name,
        g.name as grade_name,
        p.base_price
      FROM product_color_grades pcg
      JOIN products p ON pcg.product_id = p.id
      JOIN colors c ON pcg.color_id = c.id
      JOIN grade_vendida g ON pcg.grade_id = g.id
      LIMIT 15
    `);
    console.table(sampleAssociations);

    console.log("\n✅ Verificação de grades concluída!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro na verificação:", error);
    process.exit(1);
  }
}

verifyGrades();
