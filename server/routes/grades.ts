import { Router } from "express";
import db from "../lib/db";
import { GradeVendida, CreateGradeRequest } from "@shared/types";

const router = Router();

// Get all grades with items
router.get("/", async (req, res) => {
  try {
    const [gradeRows] = await db.execute(
      "SELECT * FROM grade_vendida ORDER BY name",
    );
    const grades = gradeRows as GradeVendida[];

    // Get templates for each grade
    for (const grade of grades) {
      const [templateRows] = await db.execute(
        `SELECT gt.*, s.size
         FROM grade_templates gt
         LEFT JOIN sizes s ON gt.size_id = s.id
         WHERE gt.grade_id = ?
         ORDER BY s.display_order`,
        [grade.id],
      );
      grade.templates = templateRows as any[];
    }

    res.json(grades);
  } catch (error) {
    console.error("Error fetching grades:", error);
    res.status(500).json({ error: "Failed to fetch grades" });
  }
});

// Get grade by ID with items
router.get("/:id", async (req, res) => {
  try {
    const [gradeRows] = await db.execute(
      "SELECT * FROM grade_vendida WHERE id = ?",
      [req.params.id],
    );
    const grades = gradeRows as GradeVendida[];

    if (grades.length === 0) {
      return res.status(404).json({ error: "Grade not found" });
    }

    const grade = grades[0];

    // Get templates for this grade
    const [templateRows] = await db.execute(
      `SELECT gt.*, s.size
       FROM grade_templates gt
       LEFT JOIN sizes s ON gt.size_id = s.id
       WHERE gt.grade_id = ?
       ORDER BY s.display_order`,
      [grade.id],
    );
    grade.templates = templateRows as any[];

    res.json(grade);
  } catch (error) {
    console.error("Error fetching grade:", error);
    res.status(500).json({ error: "Failed to fetch grade" });
  }
});

// Create new grade with items
router.post("/", async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { name, description, total_price, items }: CreateGradeRequest =
      req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "At least one item is required" });
    }

    // Create the grade
    const [gradeResult] = await connection.execute(
      "INSERT INTO grade_vendida (name, description, total_price) VALUES (?, ?, ?)",
      [name, description || null, total_price || null],
    );

    const gradeInsertResult = gradeResult as any;
    const gradeId = gradeInsertResult.insertId;

    // Create the items
    for (const item of items) {
      await connection.execute(
        "INSERT INTO grade_items (grade_id, product_id, size_id, color_id, quantity) VALUES (?, ?, ?, ?, ?)",
        [gradeId, item.product_id, item.size_id, item.color_id, item.quantity],
      );
    }

    await connection.commit();

    // Fetch the created grade with items
    const [gradeRows] = await db.execute(
      "SELECT * FROM grade_vendida WHERE id = ?",
      [gradeId],
    );
    const grades = gradeRows as GradeVendida[];
    const grade = grades[0];

    const [itemRows] = await db.execute(
      `SELECT gi.*, p.name as product_name, s.size, c.name as color_name, c.hex_code
       FROM grade_items gi
       LEFT JOIN products p ON gi.product_id = p.id
       LEFT JOIN sizes s ON gi.size_id = s.id
       LEFT JOIN colors c ON gi.color_id = c.id
       WHERE gi.grade_id = ?`,
      [gradeId],
    );
    grade.items = itemRows as any[];

    res.status(201).json(grade);
  } catch (error: any) {
    await connection.rollback();
    console.error("Error creating grade:", error);
    res.status(500).json({ error: "Failed to create grade" });
  } finally {
    connection.release();
  }
});

// Update grade
router.put("/:id", async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const {
      name,
      description,
      total_price,
      items,
      active,
    }: CreateGradeRequest & { active?: boolean } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    // Update the grade
    await connection.execute(
      "UPDATE grade_vendida SET name = ?, description = ?, total_price = ?, active = ? WHERE id = ?",
      [
        name,
        description || null,
        total_price || null,
        active !== undefined ? active : true,
        req.params.id,
      ],
    );

    // If items are provided, update them
    if (items && items.length > 0) {
      // Delete existing items
      await connection.execute("DELETE FROM grade_items WHERE grade_id = ?", [
        req.params.id,
      ]);

      // Create new items
      for (const item of items) {
        await connection.execute(
          "INSERT INTO grade_items (grade_id, product_id, size_id, color_id, quantity) VALUES (?, ?, ?, ?, ?)",
          [
            req.params.id,
            item.product_id,
            item.size_id,
            item.color_id,
            item.quantity,
          ],
        );
      }
    }

    await connection.commit();

    // Fetch the updated grade with items
    const [gradeRows] = await db.execute(
      "SELECT * FROM grade_vendida WHERE id = ?",
      [req.params.id],
    );
    const grades = gradeRows as GradeVendida[];

    if (grades.length === 0) {
      return res.status(404).json({ error: "Grade not found" });
    }

    const grade = grades[0];

    const [itemRows] = await db.execute(
      `SELECT gi.*, p.name as product_name, s.size, c.name as color_name, c.hex_code
       FROM grade_items gi
       LEFT JOIN products p ON gi.product_id = p.id
       LEFT JOIN sizes s ON gi.size_id = s.id
       LEFT JOIN colors c ON gi.color_id = c.id
       WHERE gi.grade_id = ?`,
      [req.params.id],
    );
    grade.items = itemRows as any[];

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

export { router as gradesRouter };
