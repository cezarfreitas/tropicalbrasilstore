import express from "express";
import db from "../lib/db";

const router = express.Router();

// GET /api/size-groups - List all size groups
router.get("/", async (req, res) => {
  try {
    const [rows] = await connection.execute(`
      SELECT id, name, description, icon, sizes, active, created_at, updated_at 
      FROM size_groups 
      ORDER BY name ASC
    `);

    // MySQL automatically parses JSON columns, so sizes is already an array
    const sizeGroups = (rows as any[]).map((row) => ({
      ...row,
      sizes: row.sizes || [],
    }));

    res.json(sizeGroups);
  } catch (error) {
    console.error("Error fetching size groups:", error);
    res.status(500).json({ error: "Failed to fetch size groups" });
  }
});

// GET /api/size-groups/:id - Get single size group
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await connection.execute(
      `
      SELECT id, name, description, icon, sizes, active, created_at, updated_at 
      FROM size_groups 
      WHERE id = ?
    `,
      [req.params.id],
    );

    const sizeGroups = rows as any[];
    if (sizeGroups.length === 0) {
      return res.status(404).json({ error: "Size group not found" });
    }

    const sizeGroup = {
      ...sizeGroups[0],
      sizes: sizeGroups[0].sizes || [],
    };

    res.json(sizeGroup);
  } catch (error) {
    console.error("Error fetching size group:", error);
    res.status(500).json({ error: "Failed to fetch size group" });
  }
});

// POST /api/size-groups - Create new size group
router.post("/", async (req, res) => {
  try {
    const { name, description, icon, sizes, active } = req.body;

    if (!name || !sizes || !Array.isArray(sizes)) {
      return res.status(400).json({
        error: "Name and sizes (array) are required",
      });
    }

    const [result] = await connection.execute(
      `
      INSERT INTO size_groups (name, description, icon, sizes, active)
      VALUES (?, ?, ?, ?, ?)
    `,
      [
        name,
        description || null,
        icon || null,
        JSON.stringify(sizes),
        active !== undefined ? active : true,
      ],
    );

    const insertId = (result as any).insertId;

    // Return the created size group
    const [rows] = await connection.execute(
      `
      SELECT id, name, description, icon, sizes, active, created_at, updated_at 
      FROM size_groups 
      WHERE id = ?
    `,
      [insertId],
    );

    const createdGroup = {
      ...(rows as any[])[0],
      sizes: (rows as any[])[0].sizes || [],
    };

    res.status(201).json(createdGroup);
  } catch (error: any) {
    console.error("Error creating size group:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        error: "A size group with this name already exists",
      });
    }

    res.status(500).json({ error: "Failed to create size group" });
  }
});

// PUT /api/size-groups/:id - Update size group
router.put("/:id", async (req, res) => {
  try {
    const { name, description, icon, sizes, active } = req.body;

    if (!name || !sizes || !Array.isArray(sizes)) {
      return res.status(400).json({
        error: "Name and sizes (array) are required",
      });
    }

    const [result] = await connection.execute(
      `
      UPDATE size_groups 
      SET name = ?, description = ?, icon = ?, sizes = ?, active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
      [
        name,
        description || null,
        icon || null,
        JSON.stringify(sizes),
        active !== undefined ? active : true,
        req.params.id,
      ],
    );

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ error: "Size group not found" });
    }

    // Return the updated size group
    const [rows] = await connection.execute(
      `
      SELECT id, name, description, icon, sizes, active, created_at, updated_at 
      FROM size_groups 
      WHERE id = ?
    `,
      [req.params.id],
    );

    const updatedGroup = {
      ...(rows as any[])[0],
      sizes: (rows as any[])[0].sizes || [],
    };

    res.json(updatedGroup);
  } catch (error: any) {
    console.error("Error updating size group:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        error: "A size group with this name already exists",
      });
    }

    res.status(500).json({ error: "Failed to update size group" });
  }
});

// DELETE /api/size-groups/:id - Delete size group
router.delete("/:id", async (req, res) => {
  try {
    const [result] = await connection.execute(
      `
      DELETE FROM size_groups WHERE id = ?
    `,
      [req.params.id],
    );

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ error: "Size group not found" });
    }

    res.json({ message: "Size group deleted successfully" });
  } catch (error) {
    console.error("Error deleting size group:", error);
    res.status(500).json({ error: "Failed to delete size group" });
  }
});

export { router as sizeGroupsRouter };
