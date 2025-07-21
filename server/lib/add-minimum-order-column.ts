import db from "./db";

export async function addMinimumOrderColumn() {
  try {
    // Check if minimum_order column exists
    const [columns] = await db.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'customers' 
      AND COLUMN_NAME = 'minimum_order'
    `);

    if ((columns as any[]).length === 0) {
      // Add the minimum_order column
      await db.execute(`
        ALTER TABLE customers 
        ADD COLUMN minimum_order DECIMAL(10,2) DEFAULT 0.00 
        COMMENT 'Minimum order amount required for this customer'
      `);
      console.log("✓ minimum_order column added to customers table");
    } else {
      console.log("ℹ️ minimum_order column already exists");
    }
  } catch (error) {
    console.error("Error adding minimum_order column:", error);
    throw error;
  }
}
