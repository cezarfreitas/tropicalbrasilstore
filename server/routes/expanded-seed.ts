import { Router } from "express";
import { seedExpandedDatabase } from "../lib/expanded-seed";

const router = Router();

router.post("/run", async (req, res) => {
  try {
    console.log("Starting expanded database seeding...");
    await seedExpandedDatabase();
    res.json({
      success: true,
      message: "Expanded database seeded successfully with 100 products!",
    });
  } catch (error) {
    console.error("Error seeding expanded database:", error);
    res.status(500).json({
      success: false,
      error: "Failed to seed expanded database",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

router.get("/status", (req, res) => {
  res.json({
    message: "Expanded seed endpoint is ready",
    endpoint: "POST /api/expanded-seed/run",
  });
});

export { router as expandedSeedRouter };
