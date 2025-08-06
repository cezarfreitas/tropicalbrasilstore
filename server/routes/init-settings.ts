import { Router } from "express";
import db from "../lib/db";

const router = Router();

// Initialize store settings with default values
router.post("/", async (req, res) => {
  try {
    // Check if settings already exist
    const [existing] = await db.execute(`
      SELECT COUNT(*) as count FROM store_settings
    `);

    if ((existing as any[])[0].count > 0) {
      return res.json({ 
        message: "Settings already exist",
        action: "skipped"
      });
    }

    // Create default settings
    await db.execute(`
      INSERT INTO store_settings (
        store_name, store_description,
        primary_color, secondary_color, accent_color, background_color, text_color,
        shipping_fee, free_shipping_threshold, minimum_order_value,
        payment_methods, maintenance_mode, allow_orders, tax_rate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      "Tropical Brasil",
      "Loja especializada em chinelos e sandálias",
      "#3b82f6", // blue-500
      "#1d4ed8", // blue-700  
      "#dbeafe", // blue-100
      "#ffffff", // white
      "#1f2937", // gray-800
      15.00,
      150.00,
      0.00,
      JSON.stringify(["pix", "credit_card", "bank_transfer"]),
      false,
      true,
      0.00
    ]);

    // Get the created settings
    const [settings] = await db.execute(`
      SELECT * FROM store_settings ORDER BY id LIMIT 1
    `);

    res.json({
      message: "Default settings created successfully",
      action: "created",
      settings: (settings as any[])[0]
    });
  } catch (error) {
    console.error("Error initializing settings:", error);
    res.status(500).json({ 
      error: "Failed to initialize settings",
      message: error.message 
    });
  }
});

// Get current settings (same as main settings endpoint but simpler)
router.get("/", async (req, res) => {
  try {
    const [settings] = await db.execute(`
      SELECT * FROM store_settings ORDER BY id LIMIT 1
    `);

    if ((settings as any[]).length === 0) {
      return res.status(404).json({ error: "No settings found" });
    }

    const storeSettings = (settings as any[])[0];
    
    // Parse JSON fields
    if (storeSettings.payment_methods) {
      try {
        storeSettings.payment_methods = JSON.parse(storeSettings.payment_methods);
      } catch (e) {
        storeSettings.payment_methods = ["pix", "credit_card"];
      }
    }

    res.json(storeSettings);
  } catch (error) {
    console.error("Error fetching init settings:", error);
    res.status(500).json({ 
      error: "Failed to fetch settings",
      message: error.message 
    });
  }
});

export { router as initSettingsRouter };
