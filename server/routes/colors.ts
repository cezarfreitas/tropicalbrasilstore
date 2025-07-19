import { Router } from "express";
import db from "../lib/db";
import { Color, CreateColorRequest } from "@shared/types";

const router = Router();

// Get all colors
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM colors ORDER BY name");
    res.json(rows);
  } catch (error) {
    console.error("Error fetching colors:", error);
    res.status(500).json({ error: "Failed to fetch colors" });
  }
});

// Get color by ID
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM colors WHERE id = ?", [
      req.params.id,
    ]);
    const colors = rows as Color[];
    if (colors.length === 0) {
      return res.status(404).json({ error: "Color not found" });
    }
    res.json(colors[0]);
  } catch (error) {
    console.error("Error fetching color:", error);
    res.status(500).json({ error: "Failed to fetch color" });
  }
});

// Create new color
router.post("/", async (req, res) => {
  try {
    const { name, hex_code }: CreateColorRequest = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    const [result] = await db.execute(
      "INSERT INTO colors (name, hex_code) VALUES (?, ?)",
      [name, hex_code || null],
    );

    const insertResult = result as any;
    const [rows] = await db.execute("SELECT * FROM colors WHERE id = ?", [
      insertResult.insertId,
    ]);
    const colors = rows as Color[];

    res.status(201).json(colors[0]);
  } catch (error: any) {
    console.error("Error creating color:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Color name already exists" });
    }
    res.status(500).json({ error: "Failed to create color" });
  }
});

// Update color
router.put("/:id", async (req, res) => {
  try {
    const { name, hex_code }: CreateColorRequest = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    await db.execute("UPDATE colors SET name = ?, hex_code = ? WHERE id = ?", [
      name,
      hex_code || null,
      req.params.id,
    ]);

    const [rows] = await db.execute("SELECT * FROM colors WHERE id = ?", [
      req.params.id,
    ]);
    const colors = rows as Color[];

    if (colors.length === 0) {
      return res.status(404).json({ error: "Color not found" });
    }

    res.json(colors[0]);
  } catch (error: any) {
    console.error("Error updating color:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Color name already exists" });
    }
    res.status(500).json({ error: "Failed to update color" });
  }
});

// Delete color
router.delete("/:id", async (req, res) => {
  try {
    const [result] = await db.execute("DELETE FROM colors WHERE id = ?", [
      req.params.id,
    ]);
    const deleteResult = result as any;

    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ error: "Color not found" });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting color:", error);
    res.status(500).json({ error: "Failed to delete color" });
  }
});

export { router as colorsRouter };
