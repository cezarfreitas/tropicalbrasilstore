import { Router } from "express";
import db from "../lib/db";

const router = Router();

// Debug theme settings
router.get("/settings", async (req, res) => {
  try {
    // Check if store_settings table exists
    const [tables] = await db.execute(`
      SELECT TABLE_NAME FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'store_settings'
    `);

    if ((tables as any[]).length === 0) {
      return res.json({
        error: "store_settings table does not exist",
        tables_found: tables,
      });
    }

    // Check table structure
    const [columns] = await db.execute(`
      SELECT COLUMN_NAME, COLUMN_DEFAULT, IS_NULLABLE 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'store_settings'
      ORDER BY ORDINAL_POSITION
    `);

    // Get all settings
    const [settings] = await db.execute(`
      SELECT * FROM store_settings ORDER BY id LIMIT 1
    `);

    res.json({
      table_exists: true,
      columns: columns,
      settings: (settings as any[])[0] || null,
      total_settings_count: (settings as any[]).length,
    });
  } catch (error) {
    console.error("Error debugging theme settings:", error);
    res.status(500).json({
      error: "Failed to debug theme settings",
      message: error.message,
    });
  }
});

// Force create settings
router.post("/create-settings", async (req, res) => {
  try {
    // Delete existing settings
    await db.execute("DELETE FROM store_settings");

    // Insert new default settings with theme colors
    await db.execute(
      `
      INSERT INTO store_settings (
        store_name, store_description, 
        primary_color, secondary_color, accent_color, background_color, text_color,
        shipping_fee, free_shipping_threshold, minimum_order_value,
        payment_methods, maintenance_mode, allow_orders, tax_rate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        "Tropical Brasil",
        "Loja especializada em chinelos",
        "#3b82f6", // blue
        "#1d4ed8", // blue-700
        "#dbeafe", // blue-100
        "#ffffff", // white
        "#1f2937", // gray-800
        15.0,
        150.0,
        0.0,
        JSON.stringify(["pix", "credit_card"]),
        false,
        true,
        0.0,
      ],
    );

    res.json({ message: "Default settings created successfully" });
  } catch (error) {
    console.error("Error creating settings:", error);
    res.status(500).json({
      error: "Failed to create settings",
      message: error.message,
    });
  }
});

export { router as debugThemeRouter };
