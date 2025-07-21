import db from "./db";

export async function addSellWithoutStockColumn() {
  try {
    console.log("Adding sell_without_stock column to products table...");

    // Check if column already exists
    const [columns] = await db.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'products' 
      AND COLUMN_NAME = 'sell_without_stock'
    `);

    if ((columns as any[]).length === 0) {
      // Add the column
      await db.execute(`
        ALTER TABLE products 
        ADD COLUMN sell_without_stock BOOLEAN DEFAULT FALSE
      `);
      console.log("✅ sell_without_stock column added successfully!");
    } else {
      console.log("ℹ️ sell_without_stock column already exists");
    }

    return true;
  } catch (error) {
    console.error("❌ Error adding sell_without_stock column:", error);
    throw error;
  }
}
