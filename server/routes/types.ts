import { Router } from "express";
import db from "../lib/db";
import { Type, CreateTypeRequest } from "@shared/types";

const router = Router();

// Get all types
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM types ORDER BY name");
    res.json(rows);
  } catch (error) {
    console.error("Error fetching types:", error);
    res.status(500).json({ error: "Failed to fetch types" });
  }
});

// Get type by ID
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM types WHERE id = ?", [
      req.params.id,
    ]);
    const types = rows as Type[];
    if (types.length === 0) {
      return res.status(404).json({ error: "Type not found" });
    }
    res.json(types[0]);
  } catch (error) {
    console.error("Error fetching type:", error);
    res.status(500).json({ error: "Failed to fetch type" });
  }
});

// Create new type
router.post("/", async (req, res) => {
  try {
    const { name, description }: CreateTypeRequest = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    const [result] = await db.execute(
      "INSERT INTO types (name, description) VALUES (?, ?)",
      [name, description || null],
    );

    const insertResult = result as any;
    const [rows] = await db.execute("SELECT * FROM types WHERE id = ?", [
      insertResult.insertId,
    ]);
    const types = rows as Type[];

    res.status(201).json(types[0]);
  } catch (error: any) {
    console.error("Error creating type:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Type name already exists" });
    }
    res.status(500).json({ error: "Failed to create type" });
  }
});

// Update type
router.put("/:id", async (req, res) => {
  try {
    const { name, description }: CreateTypeRequest = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    await db.execute(
      "UPDATE types SET name = ?, description = ? WHERE id = ?",
      [name, description || null, req.params.id],
    );

    const [rows] = await db.execute("SELECT * FROM types WHERE id = ?", [
      req.params.id,
    ]);
    const types = rows as Type[];

    if (types.length === 0) {
      return res.status(404).json({ error: "Type not found" });
    }

    res.json(types[0]);
  } catch (error: any) {
    console.error("Error updating type:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Type name already exists" });
    }
    res.status(500).json({ error: "Failed to update type" });
  }
});

// Delete type
router.delete("/:id", async (req, res) => {
  try {
    const [result] = await db.execute("DELETE FROM types WHERE id = ?", [
      req.params.id,
    ]);
    const deleteResult = result as any;

    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ error: "Type not found" });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting type:", error);
    res.status(500).json({ error: "Failed to delete type" });
  }
});

export { router as typesRouter };
