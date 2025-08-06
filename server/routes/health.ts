import { Router } from "express";
import db from "../lib/db";

const router = Router();

// Health check endpoint
router.get("/", async (req, res) => {
  try {
    const start = Date.now();

    // Simple database ping
    await db.execute("SELECT 1 as ping");

    const dbResponseTime = Date.now() - start;

    // Check if grades table exists
    const [gradeCheck] = await db.execute(
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'grade_vendida'",
    );

    const hasGrades = (gradeCheck as any)[0].count > 0;

    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        responseTime: `${dbResponseTime}ms`,
        hasGradesTable: hasGrades,
      },
    });
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(500).json({
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

export { router as healthRouter };
