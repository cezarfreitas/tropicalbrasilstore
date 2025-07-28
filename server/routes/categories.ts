import { Router } from "express";
import db from "../lib/db";
import { Category, CreateCategoryRequest } from "@shared/types";

const router = Router();

// Get all categories
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM categories ORDER BY name");
    res.json(rows);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// Get category by ID
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM categories WHERE id = ?", [
      req.params.id,
    ]);
    const categories = rows as Category[];
    if (categories.length === 0) {
      return res.status(404).json({ error: "Category not found" });
    }
    res.json(categories[0]);
  } catch (error) {
    console.error("Error fetching category:", error);
    res.status(500).json({ error: "Failed to fetch category" });
  }
});

// Create new category
router.post("/", async (req, res) => {
  try {
    const { name, description, show_in_menu }: CreateCategoryRequest = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    const [result] = await db.execute(
      "INSERT INTO categories (name, description, show_in_menu) VALUES (?, ?, ?)",
      [name, description || null, show_in_menu ?? true],
    );

    const insertResult = result as any;
    const [rows] = await db.execute("SELECT * FROM categories WHERE id = ?", [
      insertResult.insertId,
    ]);
    const categories = rows as Category[];

    res.status(201).json(categories[0]);
  } catch (error: any) {
    console.error("Error creating category:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Category name already exists" });
    }
    res.status(500).json({ error: "Failed to create category" });
  }
});

// Update category
router.put("/:id", async (req, res) => {
  try {
    const { name, description, show_in_menu }: CreateCategoryRequest = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    await db.execute(
      "UPDATE categories SET name = ?, description = ?, show_in_menu = ? WHERE id = ?",
      [name, description || null, show_in_menu ?? true, req.params.id],
    );

    const [rows] = await db.execute("SELECT * FROM categories WHERE id = ?", [
      req.params.id,
    ]);
    const categories = rows as Category[];

    if (categories.length === 0) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json(categories[0]);
  } catch (error: any) {
    console.error("Error updating category:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Category name already exists" });
    }
    res.status(500).json({ error: "Failed to update category" });
  }
});

// Delete category
router.delete("/:id", async (req, res) => {
  try {
    const [result] = await db.execute("DELETE FROM categories WHERE id = ?", [
      req.params.id,
    ]);
    const deleteResult = result as any;

    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ error: "Failed to delete category" });
  }
});

export { router as categoriesRouter };
