import db from "./db";

export async function redesignGradeSystem() {
  try {
    console.log("Redesigning Grade system...");

    // 1. Backup existing grade_items data before changes
    const [existingGradeItems] = await db.execute(`
      SELECT * FROM grade_items
    `);

    // 2. Drop existing grade_items table (wrong design)
    await db.execute("DROP TABLE IF EXISTS grade_items");

    // 3. Create new grade_templates table (defines size quantities only)
    await db.execute(`
      CREATE TABLE grade_templates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        grade_id INT NOT NULL,
        size_id INT NOT NULL,
        required_quantity INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (grade_id) REFERENCES grade_vendida(id) ON DELETE CASCADE,
        FOREIGN KEY (size_id) REFERENCES sizes(id) ON DELETE CASCADE,
        UNIQUE KEY unique_grade_size (grade_id, size_id)
      )
    `);

    // 4. Create product_color_grades table (assigns grades to product+color combinations)
    await db.execute(`
      CREATE TABLE product_color_grades (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        color_id INT NOT NULL,
        grade_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (color_id) REFERENCES colors(id) ON DELETE CASCADE,
        FOREIGN KEY (grade_id) REFERENCES grade_vendida(id) ON DELETE CASCADE,
        UNIQUE KEY unique_product_color_grade (product_id, color_id, grade_id)
      )
    `);

    // 5. Clean up grade_vendida table - remove fields that don't make sense for templates
    try {
      await db.execute("ALTER TABLE grade_vendida DROP COLUMN total_price");
    } catch (error: any) {
      if (error.code !== "ER_CANT_DROP_FIELD_OR_KEY") throw error;
    }

    // 6. Convert existing data to new structure
    console.log("Converting existing grade data...");

    // Create grade templates from existing grade_items data
    if (Array.isArray(existingGradeItems) && existingGradeItems.length > 0) {
      const groupedByGrade = (existingGradeItems as any[]).reduce(
        (acc, item) => {
          if (!acc[item.grade_id]) acc[item.grade_id] = [];
          acc[item.grade_id].push(item);
          return acc;
        },
        {},
      );

      for (const [gradeId, items] of Object.entries(groupedByGrade)) {
        for (const item of items as any[]) {
          // Create grade template (size + quantity only)
          await db.execute(
            `INSERT IGNORE INTO grade_templates (grade_id, size_id, required_quantity) VALUES (?, ?, ?)`,
            [gradeId, item.size_id, item.quantity],
          );

          // Create product-color-grade assignment
          await db.execute(
            `INSERT IGNORE INTO product_color_grades (product_id, color_id, grade_id) VALUES (?, ?, ?)`,
            [item.product_id, item.color_id, gradeId],
          );
        }
      }
    }

    // 7. Create sample grade templates
    await createSampleGradeTemplates();

    console.log("Grade system redesigned successfully!");
    return true;
  } catch (error) {
    console.error("Error redesigning grade system:", error);
    throw error;
  }
}

async function createSampleGradeTemplates() {
  try {
    // Clear existing templates
    await db.execute("DELETE FROM grade_templates");
    await db.execute("DELETE FROM product_color_grades");

    // Grade Básica Masculina - template defines quantities per size
    const basicMaleTemplates = [
      { size_id: 7, required_quantity: 4 }, // Size 38: 4 units
      { size_id: 8, required_quantity: 6 }, // Size 39: 6 units
      { size_id: 9, required_quantity: 8 }, // Size 40: 8 units
      { size_id: 10, required_quantity: 6 }, // Size 41: 6 units
      { size_id: 11, required_quantity: 4 }, // Size 42: 4 units
    ];

    for (const template of basicMaleTemplates) {
      await db.execute(
        `INSERT INTO grade_templates (grade_id, size_id, required_quantity) VALUES (?, ?, ?)`,
        [1, template.size_id, template.required_quantity],
      );
    }

    // Grade Feminina Premium
    const premiumFemaleTemplates = [
      { size_id: 3, required_quantity: 3 }, // Size 34: 3 units
      { size_id: 4, required_quantity: 5 }, // Size 35: 5 units
      { size_id: 5, required_quantity: 6 }, // Size 36: 6 units
      { size_id: 6, required_quantity: 5 }, // Size 37: 5 units
      { size_id: 7, required_quantity: 3 }, // Size 38: 3 units
    ];

    for (const template of premiumFemaleTemplates) {
      await db.execute(
        `INSERT INTO grade_templates (grade_id, size_id, required_quantity) VALUES (?, ?, ?)`,
        [2, template.size_id, template.required_quantity],
      );
    }

    // Grade Infantil Colorida
    const kidsTemplates = [
      { size_id: 1, required_quantity: 2 }, // Size 32: 2 units
      { size_id: 2, required_quantity: 3 }, // Size 33: 3 units
      { size_id: 3, required_quantity: 4 }, // Size 34: 4 units
      { size_id: 4, required_quantity: 3 }, // Size 35: 3 units
      { size_id: 5, required_quantity: 2 }, // Size 36: 2 units
    ];

    for (const template of kidsTemplates) {
      await db.execute(
        `INSERT INTO grade_templates (grade_id, size_id, required_quantity) VALUES (?, ?, ?)`,
        [3, template.size_id, template.required_quantity],
      );
    }

    // Assign grades to specific product+color combinations
    const productColorGradeAssignments = [
      // Havaianas Brasil (product_id: 1) + Preto (color_id: 1) = Grade Básica Masculina
      { product_id: 1, color_id: 1, grade_id: 1 },
      // Havaianas Brasil (product_id: 1) + Branco (color_id: 2) = Grade Básica Masculina
      { product_id: 1, color_id: 2, grade_id: 1 },

      // Havaianas Slim (product_id: 2) + Rosa (color_id: 5) = Grade Feminina Premium
      { product_id: 2, color_id: 5, grade_id: 2 },
      // Havaianas Slim (product_id: 2) + Branco (color_id: 2) = Grade Feminina Premium
      { product_id: 2, color_id: 2, grade_id: 2 },

      // Havaianas Kids (product_id: 6) + multiple colors = Grade Infantil
      { product_id: 6, color_id: 4, grade_id: 3 }, // Vermelho
      { product_id: 6, color_id: 7, grade_id: 3 }, // Amarelo
      { product_id: 6, color_id: 6, grade_id: 3 }, // Verde
      { product_id: 6, color_id: 5, grade_id: 3 }, // Rosa
      { product_id: 6, color_id: 3, grade_id: 3 }, // Azul Marinho
    ];

    for (const assignment of productColorGradeAssignments) {
      await db.execute(
        `INSERT IGNORE INTO product_color_grades (product_id, color_id, grade_id) VALUES (?, ?, ?)`,
        [assignment.product_id, assignment.color_id, assignment.grade_id],
      );
    }

    console.log("Sample grade templates and assignments created!");
  } catch (error) {
    console.error("Error creating sample grade templates:", error);
  }
}
