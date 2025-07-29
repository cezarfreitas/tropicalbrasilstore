import { Router } from "express";
import db from "../lib/db";
import { Gender, CreateGenderRequest } from "@shared/types";

const router = Router();

// Get all genders
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM genders ORDER BY name");
    res.json(rows);
  } catch (error) {
    console.error("Error fetching genders:", error);
    res.status(500).json({ error: "Failed to fetch genders" });
  }
});

// Get gender by ID
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM genders WHERE id = ?", [
      req.params.id,
    ]);
    const genders = rows as Gender[];
    if (genders.length === 0) {
      return res.status(404).json({ error: "Gender not found" });
    }
    res.json(genders[0]);
  } catch (error) {
    console.error("Error fetching gender:", error);
    res.status(500).json({ error: "Failed to fetch gender" });
  }
});

// Create new gender
router.post("/", async (req, res) => {
  try {
    const { name, description }: CreateGenderRequest = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    const [result] = await db.execute(
      "INSERT INTO genders (name, description) VALUES (?, ?)",
      [name, description || null],
    );

    const insertResult = result as any;
    const [rows] = await db.execute("SELECT * FROM genders WHERE id = ?", [
      insertResult.insertId,
    ]);
    const genders = rows as Gender[];

    res.status(201).json(genders[0]);
  } catch (error: any) {
    console.error("Error creating gender:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Gender name already exists" });
    }
    res.status(500).json({ error: "Failed to create gender" });
  }
});

// Update gender
router.put("/:id", async (req, res) => {
  try {
    const { name, description }: CreateGenderRequest = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    await db.execute(
      "UPDATE genders SET name = ?, description = ? WHERE id = ?",
      [name, description || null, req.params.id],
    );

    const [rows] = await db.execute("SELECT * FROM genders WHERE id = ?", [
      req.params.id,
    ]);
    const genders = rows as Gender[];

    if (genders.length === 0) {
      return res.status(404).json({ error: "Gender not found" });
    }

    res.json(genders[0]);
  } catch (error: any) {
    console.error("Error updating gender:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Gender name already exists" });
    }
    res.status(500).json({ error: "Failed to update gender" });
  }
});

// Delete gender
router.delete("/:id", async (req, res) => {
  try {
    const [result] = await db.execute("DELETE FROM genders WHERE id = ?", [
      req.params.id,
    ]);
    const deleteResult = result as any;

    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ error: "Gender not found" });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting gender:", error);
    res.status(500).json({ error: "Failed to delete gender" });
  }
});

export { router as gendersRouter };
