import { Router } from "express";
import { addSampleProducts } from "../lib/simple-seed";
import { addSampleGrades } from "../lib/add-grades";

const router = Router();

router.post("/run", async (req, res) => {
  try {
    console.log("Adding sample products...");
    const success = await addSampleProducts();
    if (success) {
      res.json({
        success: true,
        message: "Sample products added successfully!",
      });
    } else {
      res.json({
        success: false,
        message: "Could not add products - check basic data exists",
      });
    }
  } catch (error) {
    console.error("Error adding sample products:", error);
    res.status(500).json({
      success: false,
      error: "Failed to add sample products",
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
