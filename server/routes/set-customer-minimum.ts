import { Router } from "express";
import db from "../lib/db";

const router = Router();

// Set minimum order for specific customer
router.post("/", async (req, res) => {
  try {
    const { email, minimum_order } = req.body;

    if (!email || minimum_order === undefined) {
      return res
        .status(400)
        .json({ error: "Email and minimum_order are required" });
    }

    // Update customer minimum order
    const [result] = await db.execute(
      `
      UPDATE customers 
      SET minimum_order = ?, updated_at = NOW()
      WHERE email = ?
    `,
      [minimum_order, email],
    );

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    // Get updated customer data
    const [customer] = await db.execute(
      `
      SELECT email, name, minimum_order, created_at, updated_at
      FROM customers 
      WHERE email = ?
    `,
      [email],
    );

    res.json({
      message: "Customer minimum order updated successfully",
      customer: (customer as any[])[0],
    });
  } catch (error) {
    console.error("Error setting customer minimum order:", error);
    res.status(500).json({
      error: "Failed to set customer minimum order",
      message: error.message,
    });
  }
});

// Get customer minimum order
router.get("/:email", async (req, res) => {
  try {
    const { email } = req.params;

    const [customer] = await db.execute(
      `
      SELECT email, name, minimum_order, created_at, updated_at
      FROM customers 
      WHERE email = ?
    `,
      [decodeURIComponent(email)],
    );

    if ((customer as any[]).length === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.json((customer as any[])[0]);
  } catch (error) {
    console.error("Error getting customer minimum order:", error);
    res.status(500).json({
      error: "Failed to get customer minimum order",
      message: error.message,
    });
  }
});

export { router as setCustomerMinimumRouter };
