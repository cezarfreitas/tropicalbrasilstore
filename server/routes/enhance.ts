import { Router } from "express";
import { enhanceDatabase } from "../lib/enhanced-seed";

const router = Router();

// Endpoint to enhance database schema and add sample data
router.post("/", async (req, res) => {
  try {
    await enhanceDatabase();
    res.json({
      message: "Database enhanced successfully",
      enhancements: [
        "Added photo column to products",
        "Added suggested_price column to products",
        "Added stock column to products",
        "Created product_variants table (size + color combinations)",
        "Created product_grades junction table",
        "Added sample product variants and enhanced data",
      ],
    });
  } catch (error) {
    console.error("Error enhancing database:", error);
    res.status(500).json({ error: "Failed to enhance database" });
  }
});

export { router as enhanceRouter };
