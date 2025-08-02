import { Router } from "express";
import db from "../lib/db";
import { Brand, CreateBrandRequest } from "@shared/types";

const router = Router();

// Get all brands
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM brands ORDER BY name");
    res.json(rows);
  } catch (error) {
    console.error("Error fetching brands:", error);
    res.status(500).json({ error: "Failed to fetch brands" });
  }
});

// Get brand by ID
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM brands WHERE id = ?", [
      req.params.id,
    ]);
    const brands = rows as Brand[];
    if (brands.length === 0) {
      return res.status(404).json({ error: "Brand not found" });
    }
    res.json(brands[0]);
  } catch (error) {
    console.error("Error fetching brand:", error);
    res.status(500).json({ error: "Failed to fetch brand" });
  }
});

// Create new brand
router.post("/", async (req, res) => {
  try {
    const { name, description }: CreateBrandRequest = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    const [result] = await db.execute(
      "INSERT INTO brands (name, description) VALUES (?, ?)",
      [name, description || null],
    );

    const insertResult = result as any;
    const [rows] = await db.execute("SELECT * FROM brands WHERE id = ?", [
      insertResult.insertId,
    ]);
    const brands = rows as Brand[];

    res.status(201).json(brands[0]);
  } catch (error: any) {
    console.error("Error creating brand:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Brand name already exists" });
    }
    res.status(500).json({ error: "Failed to create brand" });
  }
});

// Update brand
router.put("/:id", async (req, res) => {
  try {
    const { name, description }: CreateBrandRequest = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    await db.execute(
      "UPDATE brands SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [name, description || null, req.params.id],
    );

    const [rows] = await db.execute("SELECT * FROM brands WHERE id = ?", [
      req.params.id,
    ]);
    const brands = rows as Brand[];

    if (brands.length === 0) {
      return res.status(404).json({ error: "Brand not found" });
    }

    res.json(brands[0]);
  } catch (error: any) {
    console.error("Error updating brand:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Brand name already exists" });
    }
    res.status(500).json({ error: "Failed to update brand" });
  }
});

// Delete brand
router.delete("/:id", async (req, res) => {
  try {
    const [result] = await db.execute("DELETE FROM brands WHERE id = ?", [
      req.params.id,
    ]);
    const deleteResult = result as any;

    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ error: "Brand not found" });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting brand:", error);
    res.status(500).json({ error: "Failed to delete brand" });
  }
});

export { router as brandsRouter };
