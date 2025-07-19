import { Router } from "express";
import { seedDatabase } from "../lib/seed";

const router = Router();

// Endpoint to recreate and seed database
router.post("/", async (req, res) => {
  try {
    await seedDatabase();
    res.json({
      message: "Database recreated and seeded successfully",
      data: {
        categories: 5,
        sizes: 13,
        colors: 10,
        products: 10,
        grades: 3,
        gradeItems: 15,
      },
    });
  } catch (error) {
    console.error("Error seeding database:", error);
    res.status(500).json({ error: "Failed to seed database" });
  }
});

export { router as seedRouter };
