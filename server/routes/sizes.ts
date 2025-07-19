import { Router } from "express";
import db from "../lib/db";
import { Size, CreateSizeRequest } from "@shared/types";

const router = Router();

// Get all sizes
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT * FROM sizes ORDER BY display_order, size",
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching sizes:", error);
    res.status(500).json({ error: "Failed to fetch sizes" });
  }
});

// Get size by ID
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM sizes WHERE id = ?", [
      req.params.id,
    ]);
    const sizes = rows as Size[];
    if (sizes.length === 0) {
      return res.status(404).json({ error: "Size not found" });
    }
    res.json(sizes[0]);
  } catch (error) {
    console.error("Error fetching size:", error);
    res.status(500).json({ error: "Failed to fetch size" });
  }
});

// Create new size
router.post("/", async (req, res) => {
  try {
    const { size, display_order }: CreateSizeRequest = req.body;

    if (!size) {
      return res.status(400).json({ error: "Size is required" });
    }

    const [result] = await db.execute(
      "INSERT INTO sizes (size, display_order) VALUES (?, ?)",
      [size, display_order || 0],
    );

    const insertResult = result as any;
    const [rows] = await db.execute("SELECT * FROM sizes WHERE id = ?", [
      insertResult.insertId,
    ]);
    const sizes = rows as Size[];

    res.status(201).json(sizes[0]);
  } catch (error: any) {
    console.error("Error creating size:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Size already exists" });
    }
    res.status(500).json({ error: "Failed to create size" });
  }
});

// Update size
router.put("/:id", async (req, res) => {
  try {
    const { size, display_order }: CreateSizeRequest = req.body;

    if (!size) {
      return res.status(400).json({ error: "Size is required" });
    }

    await db.execute(
      "UPDATE sizes SET size = ?, display_order = ? WHERE id = ?",
      [size, display_order || 0, req.params.id],
    );

    const [rows] = await db.execute("SELECT * FROM sizes WHERE id = ?", [
      req.params.id,
    ]);
    const sizes = rows as Size[];

    if (sizes.length === 0) {
      return res.status(404).json({ error: "Size not found" });
    }

    res.json(sizes[0]);
  } catch (error: any) {
    console.error("Error updating size:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Size already exists" });
    }
    res.status(500).json({ error: "Failed to update size" });
  }
});

// Delete size
router.delete("/:id", async (req, res) => {
  try {
    const [result] = await db.execute("DELETE FROM sizes WHERE id = ?", [
      req.params.id,
    ]);
    const deleteResult = result as any;

    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ error: "Size not found" });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting size:", error);
    res.status(500).json({ error: "Failed to delete size" });
  }
});

export { router as sizesRouter };
