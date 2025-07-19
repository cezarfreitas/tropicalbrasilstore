import { Router } from "express";
import db from "../lib/db";

const router = Router();

// Get dashboard statistics
router.get("/", async (req, res) => {
  try {
    const [categoriesCount] = await db.execute(
      "SELECT COUNT(*) as count FROM categories",
    );
    const [sizesCount] = await db.execute(
      "SELECT COUNT(*) as count FROM sizes",
    );
    const [colorsCount] = await db.execute(
      "SELECT COUNT(*) as count FROM colors",
    );
    const [productsCount] = await db.execute(
      "SELECT COUNT(*) as count FROM products",
    );
    const [gradesCount] = await db.execute(
      "SELECT COUNT(*) as count FROM grade_vendida",
    );

    const stats = {
      categories: (categoriesCount as any)[0].count,
      sizes: (sizesCount as any)[0].count,
      colors: (colorsCount as any)[0].count,
      products: (productsCount as any)[0].count,
      grades: (gradesCount as any)[0].count,
    };

    res.json(stats);
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

export { router as statsRouter };
