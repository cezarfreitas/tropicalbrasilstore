import { Router } from "express";
import db from "../lib/db";

const router = Router();

// Get all grades (templates) with their size requirements
router.get("/", async (req, res) => {
  try {
    console.log("📊 Fetching grades...");

    // First check if grade_vendida table exists
    let gradeRows;
    try {
      [gradeRows] = await db.execute(
        "SELECT * FROM grade_vendida ORDER BY name",
      );
      console.log(`📊 Found ${(gradeRows as any[]).length} grades in grade_vendida`);
    } catch (tableError) {
      console.warn("⚠️ grade_vendida table doesn't exist, falling back to grades table");

      // Fallback to grades table if grade_vendida doesn't exist
      try {
        [gradeRows] = await db.execute(
          "SELECT * FROM grades ORDER BY name",
        );
        console.log(`📊 Found ${(gradeRows as any[]).length} grades in grades table`);
      } catch (fallbackError) {
        console.error("❌ Neither grade_vendida nor grades table exists");
        return res.json([]); // Return empty array instead of error
      }
    }

    const grades = gradeRows as any[];

    // Get template requirements for each grade
    for (const grade of grades) {
      try {
        const [templateRows] = await db.execute(
          `SELECT gt.*, s.size, s.display_order
           FROM grade_templates gt
           LEFT JOIN sizes s ON gt.size_id = s.id
           WHERE gt.grade_id = ?
           ORDER BY s.display_order`,
          [grade.id],
        );
        grade.templates = templateRows;

        // Get count of product-color assignments using this grade
        const [assignmentCount] = await db.execute(
          `SELECT COUNT(*) as count FROM product_color_grades WHERE grade_id = ?`,
          [grade.id],
        );
        grade.assignment_count = (assignmentCount as any)[0].count;
      } catch (detailError) {
        console.warn(`⚠️ Error getting details for grade ${grade.id}:`, detailError.message);
        grade.templates = [];
        grade.assignment_count = 0;
      }
    }

    console.log(`✅ Successfully fetched ${grades.length} grades`);
    res.json(grades);
  } catch (error) {
    console.error("❌ Error fetching grades:", error);
    // Return empty array instead of error to prevent frontend crash
    res.json([]);
  }
});

// Get grade by ID with templates and assignments
router.get("/:id", async (req, res) => {
  try {
    const [gradeRows] = await db.execute(
      "SELECT * FROM grade_vendida WHERE id = ?",
      [req.params.id],
    );

    if (gradeRows.length === 0) {
      return res.status(404).json({ error: "Grade not found" });
    }

    const grade = (gradeRows as any)[0];

    // Get templates
    const [templateRows] = await db.execute(
      `SELECT gt.*, s.size, s.display_order
       FROM grade_templates gt
       LEFT JOIN sizes s ON gt.size_id = s.id
       WHERE gt.grade_id = ?
       ORDER BY s.display_order`,
      [grade.id],
    );
    grade.templates = templateRows;

    // Get product-color assignments
    const [assignmentRows] = await db.execute(
      `SELECT pcg.*, p.name as product_name, c.name as color_name, c.hex_code
       FROM product_color_grades pcg
       LEFT JOIN products p ON pcg.product_id = p.id
       LEFT JOIN colors c ON pcg.color_id = c.id
       WHERE pcg.grade_id = ?`,
      [grade.id],
    );
    grade.assignments = assignmentRows;

    res.json(grade);
  } catch (error) {
    console.error("Error fetching grade:", error);
    res.status(500).json({ error: "Failed to fetch grade" });
  }
});

// Create new grade template
router.post("/", async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { name, description, templates = [] } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    // Create the grade
    const [gradeResult] = await connection.execute(
      "INSERT INTO grade_vendida (name, description) VALUES (?, ?)",
      [name, description || null],
    );

    const gradeId = (gradeResult as any).insertId;

    // Create templates
    for (const template of templates) {
      if (template.size_id && template.required_quantity > 0) {
        await connection.execute(
          "INSERT INTO grade_templates (grade_id, size_id, required_quantity) VALUES (?, ?, ?)",
          [gradeId, template.size_id, template.required_quantity],
        );
      }
    }

    await connection.commit();

    // Fetch the created grade with templates
    const [gradeRows] = await db.execute(
      "SELECT * FROM grade_vendida WHERE id = ?",
      [gradeId],
    );
    const grade = (gradeRows as any)[0];

    const [templateRows] = await db.execute(
      `SELECT gt.*, s.size, s.display_order
       FROM grade_templates gt
       LEFT JOIN sizes s ON gt.size_id = s.id
       WHERE gt.grade_id = ?
       ORDER BY s.display_order`,
      [gradeId],
    );
    grade.templates = templateRows;

    res.status(201).json(grade);
  } catch (error: any) {
    await connection.rollback();
    console.error("Error creating grade:", error);
    res.status(500).json({ error: "Failed to create grade" });
  } finally {
    connection.release();
  }
});

// Update grade template
router.put("/:id", async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { name, description, templates = [], active } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    // Update the grade
    await connection.execute(
      "UPDATE grade_vendida SET name = ?, description = ?, active = ? WHERE id = ?",
      [
        name,
        description || null,
        active !== undefined ? active : true,
        req.params.id,
      ],
    );

    // Update templates
    if (templates.length >= 0) {
      // Delete existing templates
      await connection.execute(
        "DELETE FROM grade_templates WHERE grade_id = ?",
        [req.params.id],
      );

      // Create new templates
      for (const template of templates) {
        if (template.size_id && template.required_quantity > 0) {
          await connection.execute(
            "INSERT INTO grade_templates (grade_id, size_id, required_quantity) VALUES (?, ?, ?)",
            [req.params.id, template.size_id, template.required_quantity],
          );
        }
      }
    }

    await connection.commit();

    // Fetch the updated grade
    const [gradeRows] = await db.execute(
      "SELECT * FROM grade_vendida WHERE id = ?",
      [req.params.id],
    );

    if (gradeRows.length === 0) {
      return res.status(404).json({ error: "Grade not found" });
    }

    const grade = (gradeRows as any)[0];

    const [templateRows] = await db.execute(
      `SELECT gt.*, s.size, s.display_order
       FROM grade_templates gt
       LEFT JOIN sizes s ON gt.size_id = s.id
       WHERE gt.grade_id = ?
       ORDER BY s.display_order`,
      [req.params.id],
    );
    grade.templates = templateRows;

    res.json(grade);
  } catch (error: any) {
    await connection.rollback();
    console.error("Error updating grade:", error);
    res.status(500).json({ error: "Failed to update grade" });
  } finally {
    connection.release();
  }
});

// Delete grade
router.delete("/:id", async (req, res) => {
  try {
    const [result] = await db.execute(
      "DELETE FROM grade_vendida WHERE id = ?",
      [req.params.id],
    );
    const deleteResult = result as any;

    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ error: "Grade not found" });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting grade:", error);
    res.status(500).json({ error: "Failed to delete grade" });
  }
});

// Get product-color combinations that can use a specific grade
router.get("/:id/available-assignments", async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT DISTINCT 
        pv.product_id, 
        pv.color_id,
        p.name as product_name,
        c.name as color_name,
        c.hex_code,
        CASE 
          WHEN pcg.id IS NOT NULL THEN true 
          ELSE false 
        END as already_assigned
      FROM product_variants pv
      LEFT JOIN products p ON pv.product_id = p.id
      LEFT JOIN colors c ON pv.color_id = c.id
      LEFT JOIN product_color_grades pcg ON (pv.product_id = pcg.product_id AND pv.color_id = pcg.color_id AND pcg.grade_id = ?)
      WHERE p.active = true
      ORDER BY p.name, c.name`,
      [req.params.id],
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching available assignments:", error);
    res.status(500).json({ error: "Failed to fetch available assignments" });
  }
});

// Assign grade to product-color combination
router.post("/:id/assign", async (req, res) => {
  try {
    const { product_id, color_id } = req.body;

    if (!product_id || !color_id) {
      return res
        .status(400)
        .json({ error: "Product ID and Color ID are required" });
    }

    await db.execute(
      `INSERT IGNORE INTO product_color_grades (product_id, color_id, grade_id) VALUES (?, ?, ?)`,
      [product_id, color_id, req.params.id],
    );

    res.json({ message: "Grade assigned successfully" });
  } catch (error) {
    console.error("Error assigning grade:", error);
    res.status(500).json({ error: "Failed to assign grade" });
  }
});

// Remove grade assignment from product-color combination
router.delete("/:id/assign", async (req, res) => {
  try {
    const { product_id, color_id } = req.body;

    await db.execute(
      `DELETE FROM product_color_grades WHERE product_id = ? AND color_id = ? AND grade_id = ?`,
      [product_id, color_id, req.params.id],
    );

    res.json({ message: "Grade assignment removed successfully" });
  } catch (error) {
    console.error("Error removing grade assignment:", error);
    res.status(500).json({ error: "Failed to remove grade assignment" });
  }
});

export { router as gradesRedesignedRouter };
