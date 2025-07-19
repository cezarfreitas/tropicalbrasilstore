import db from "./db";

export async function addSampleGrades() {
  try {
    console.log("Adding sample grades...");

    // Check if grades already exist
    const [existingGrades] = await db.execute(
      "SELECT COUNT(*) as count FROM grade_vendida",
    );
    const gradeCount = (existingGrades as any)[0].count;

    if (gradeCount > 0) {
      console.log(`Already have ${gradeCount} grades, adding associations...`);
    } else {
      // Create basic grades
      const grades = [
        {
          name: "Grade Pequena (12 pares)",
          description: "Grade com 12 pares sortidos",
          templates: [
            { size: "36", quantity: 1 },
            { size: "37", quantity: 2 },
            { size: "38", quantity: 3 },
            { size: "39", quantity: 3 },
            { size: "40", quantity: 2 },
            { size: "41", quantity: 1 },
          ],
        },
        {
          name: "Grade Média (24 pares)",
          description: "Grade com 24 pares sortidos",
          templates: [
            { size: "36", quantity: 2 },
            { size: "37", quantity: 4 },
            { size: "38", quantity: 6 },
            { size: "39", quantity: 6 },
            { size: "40", quantity: 4 },
            { size: "41", quantity: 2 },
          ],
        },
        {
          name: "Grade Grande (36 pares)",
          description: "Grade com 36 pares sortidos",
          templates: [
            { size: "35", quantity: 2 },
            { size: "36", quantity: 4 },
            { size: "37", quantity: 6 },
            { size: "38", quantity: 8 },
            { size: "39", quantity: 8 },
            { size: "40", quantity: 6 },
            { size: "41", quantity: 2 },
          ],
        },
      ];

      for (const grade of grades) {
        // Create grade
        const [gradeResult] = await db.execute(
          "INSERT INTO grade_vendida (name, description, active) VALUES (?, ?, true)",
          [grade.name, grade.description],
        );

        const gradeId = (gradeResult as any).insertId;

        // Create grade templates
        for (const template of grade.templates) {
          // Get size ID
          const [sizeRows] = await db.execute(
            "SELECT id FROM sizes WHERE size = ?",
            [template.size],
          );

          if ((sizeRows as any[]).length > 0) {
            const sizeId = (sizeRows as any)[0].id;
            await db.execute(
              "INSERT INTO grade_templates (grade_id, size_id, required_quantity) VALUES (?, ?, ?)",
              [gradeId, sizeId, template.quantity],
            );
          }
        }

        console.log(`Created grade: ${grade.name}`);
      }
    }

    // Get all grades, products, and colors
    const [grades] = await db.execute("SELECT id FROM grade_vendida");
    const [products] = await db.execute("SELECT id FROM products");
    const [colors] = await db.execute("SELECT id FROM colors");

    const gradeIds = (grades as any[]).map((g) => g.id);
    const productIds = (products as any[]).map((p) => p.id);
    const colorIds = (colors as any[]).map((c) => c.id);

    console.log(
      `Found ${gradeIds.length} grades, ${productIds.length} products, ${colorIds.length} colors`,
    );

    // Create associations between products, colors, and grades
    let associationsCreated = 0;

    for (const productId of productIds) {
      // Each product gets 2-3 grades
      const numGrades = Math.floor(Math.random() * 2) + 2; // 2-3 grades
      const selectedGrades = gradeIds
        .sort(() => 0.5 - Math.random())
        .slice(0, numGrades);

      for (const gradeId of selectedGrades) {
        // Each grade gets 2-4 colors for this product
        const numColors = Math.floor(Math.random() * 3) + 2; // 2-4 colors
        const selectedColors = colorIds
          .sort(() => 0.5 - Math.random())
          .slice(0, numColors);

        for (const colorId of selectedColors) {
          // Check if association already exists
          const [existing] = await db.execute(
            "SELECT id FROM product_color_grades WHERE product_id = ? AND color_id = ? AND grade_id = ?",
            [productId, colorId, gradeId],
          );

          if ((existing as any[]).length === 0) {
            await db.execute(
              "INSERT INTO product_color_grades (product_id, color_id, grade_id) VALUES (?, ?, ?)",
              [productId, colorId, gradeId],
            );
            associationsCreated++;
          }
        }
      }
    }

    console.log(
      `✅ Created ${associationsCreated} product-color-grade associations`,
    );

    // Show final stats
    const [finalAssociations] = await db.execute(
      "SELECT COUNT(*) as count FROM product_color_grades",
    );
    console.log(
      `✅ Total associations: ${(finalAssociations as any)[0].count}`,
    );

    return true;
  } catch (error) {
    console.error("❌ Error adding sample grades:", error);
    throw error;
  }
}
