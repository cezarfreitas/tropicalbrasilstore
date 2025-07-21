import db from "./db";

export async function addPriceOverrideColumn() {
  try {
    // Check if price_override column already exists
    const [columns] = await db.execute(`
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'product_variants' 
      AND COLUMN_NAME = 'price_override'
    `);

    if ((columns as any[]).length > 0) {
      console.log("ℹ️ price_override column already exists");
      return;
    }

    console.log("📦 Adding price_override column to product_variants table...");

    // Add price_override column
    await db.execute(`
      ALTER TABLE product_variants 
      ADD COLUMN price_override DECIMAL(10,2) NULL DEFAULT NULL
    `);

    console.log("✅ price_override column added successfully");

  } catch (error) {
    console.error("❌ Error adding price_override column:", error);
    throw error;
  }
}
