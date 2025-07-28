import db from "./db";

export async function addVariantImageColumn() {
  try {
    // Check if image column already exists
    const [columns] = await db.execute(`
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'product_variants' 
      AND COLUMN_NAME = 'image_url'
    `);

    if ((columns as any[]).length > 0) {
      console.log("ℹ️ image_url column already exists in product_variants table");
      return;
    }

    console.log("📦 Adding image_url column to product_variants table...");

    // Add image_url column to product_variants table
    await db.execute(`
      ALTER TABLE product_variants 
      ADD COLUMN image_url VARCHAR(500) NULL 
      AFTER color_id
    `);

    console.log("✅ image_url column added to product_variants table successfully");

  } catch (error) {
    console.error("❌ Error adding image_url column to product_variants table:", error);
    throw error;
  }
}
