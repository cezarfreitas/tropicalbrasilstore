import db from "../lib/db";

async function checkGradeStock() {
  try {
    console.log("🔍 Verificando estoque de grades...");

    // Check product_color_grades table
    console.log("\n📊 TABELA: product_color_grades");
    const [gradeStock] = await db.execute(`
      SELECT 
        pcg.id,
        p.name as product_name,
        c.name as color_name,
        gv.name as grade_name,
        pcg.stock_quantity,
        pcg.product_id,
        pcg.color_id,
        pcg.grade_id
      FROM product_color_grades pcg
      LEFT JOIN products p ON pcg.product_id = p.id
      LEFT JOIN colors c ON pcg.color_id = c.id
      LEFT JOIN grade_vendida gv ON pcg.grade_id = gv.id
      ORDER BY pcg.id DESC
      LIMIT 10
    `);
    
    if ((gradeStock as any[]).length > 0) {
      console.table(gradeStock);
    } else {
      console.log("❌ Nenhum estoque de grade encontrado");
    }

    // Check grades table
    console.log("\n📋 TABELA: grade_vendida");
    const [grades] = await db.execute(`
      SELECT id, name, description, active
      FROM grade_vendida 
      ORDER BY name
      LIMIT 10
    `);
    
    if ((grades as any[]).length > 0) {
      console.table(grades);
    } else {
      console.log("❌ Nenhuma grade encontrada");
    }

    // Check if specific product has grade stock
    console.log("\n🔍 VERIFICAÇÃO ESPECÍFICA - Chinelo ABC:");
    const [specific] = await db.execute(`
      SELECT 
        p.name as product_name,
        c.name as color_name,
        gv.name as grade_name,
        pcg.stock_quantity
      FROM products p
      LEFT JOIN product_color_grades pcg ON p.id = pcg.product_id
      LEFT JOIN colors c ON pcg.color_id = c.id
      LEFT JOIN grade_vendida gv ON pcg.grade_id = gv.id
      WHERE p.name LIKE '%Chinelo ABC%'
    `);
    
    if ((specific as any[]).length > 0) {
      console.table(specific);
    } else {
      console.log("❌ Nenhum estoque de grade para Chinelo ABC");
    }

    // Check if grades exist for import
    console.log("\n🔍 GRADES DISPONÍVEIS PARA IMPORTAÇÃO:");
    const [availableGrades] = await db.execute(`
      SELECT id, name, description, active
      FROM grade_vendida 
      WHERE name IN ('2549', '2550', '9999')
      ORDER BY name
    `);
    
    if ((availableGrades as any[]).length > 0) {
      console.table(availableGrades);
    } else {
      console.log("❌ Grades 2549, 2550, 9999 não encontradas");
    }

  } catch (error) {
    console.error("❌ Erro:", error);
    throw error;
  }
}

// Execute if run directly
checkGradeStock()
  .then(() => {
    console.log("\n🎉 Verificação concluída!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Falha na verificação:", error);
    process.exit(1);
  });
