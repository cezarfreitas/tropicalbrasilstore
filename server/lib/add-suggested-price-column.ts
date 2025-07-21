import db from "./db";

export async function addSuggestedPriceColumn() {
  try {
    // Check if suggested_price column already exists
    const [columns] = await db.execute(`
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'products' 
      AND COLUMN_NAME = 'suggested_price'
    `);

    if ((columns as any[]).length > 0) {
      console.log("ℹ️ suggested_price column already exists");
      return;
    }

    console.log("📦 Adding suggested_price column to products table...");

    // Add suggested_price column
    await db.execute(`
      ALTER TABLE products 
      ADD COLUMN suggested_price DECIMAL(10,2) NULL DEFAULT NULL
    `);

    console.log("✅ suggested_price column added successfully");

  } catch (error) {
    console.error("❌ Error adding suggested_price column:", error);
    throw error;
  }
}
