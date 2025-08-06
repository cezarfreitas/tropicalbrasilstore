import { Router } from "express";
import db from "../lib/db";

const router = Router();

// Check database connection and show current customers
router.get("/verify", async (req, res) => {
  try {
    // Get database name
    const [dbInfo] = await db.execute("SELECT DATABASE() as current_database");
    
    // Get customers count and list
    const [customers] = await db.execute(`
      SELECT email, name, minimum_order, created_at 
      FROM customers 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    // Get total count
    const [count] = await db.execute("SELECT COUNT(*) as total FROM customers");
    
    res.json({
      database: (dbInfo as any)[0].current_database,
      total_customers: (count as any)[0].total,
      recent_customers: customers
    });
  } catch (error) {
    console.error("Error verifying database:", error);
    res.status(500).json({ error: "Failed to verify database" });
  }
});

// Check specific customer
router.get("/customer/:email", async (req, res) => {
  try {
    const [customer] = await db.execute(`
      SELECT * FROM customers WHERE email = ?
    `, [req.params.email]);
    
    if ((customer as any[]).length === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }
    
    res.json(customer[0]);
  } catch (error) {
    console.error("Error checking customer:", error);
    res.status(500).json({ error: "Failed to check customer" });
  }
});

export { router as debugDatabaseRouter };
