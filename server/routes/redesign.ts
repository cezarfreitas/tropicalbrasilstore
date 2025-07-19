import { Router } from "express";
import { redesignGradeSystem } from "../lib/redesign-grades";

const router = Router();

// Endpoint to redesign the grade system
router.post("/grades", async (req, res) => {
  try {
    await redesignGradeSystem();
    res.json({
      message: "Grade system redesigned successfully",
      changes: [
        "Grades are now templates that define size quantities only",
        "Product-color combinations can be assigned specific grades",
        "Stock is managed at product variant level (product+size+color)",
        "Customers must buy according to grade rules for each product-color",
        "Grades can be reused across different products and colors",
      ],
    });
  } catch (error) {
    console.error("Error redesigning grade system:", error);
    res.status(500).json({ error: "Failed to redesign grade system" });
  }
});

export { router as redesignRouter };
