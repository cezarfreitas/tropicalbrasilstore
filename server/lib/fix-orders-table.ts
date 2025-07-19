import db from "./db";

export async function fixOrdersTable() {
  try {
    console.log("Checking and fixing orders table structure...");

    // Check if total_amount column exists
    const [columns] = await db.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'orders' 
      AND COLUMN_NAME = 'total_amount'
    `);

    if ((columns as any[]).length === 0) {
      console.log("Adding total_amount column to orders table...");
      await db.execute(`
        ALTER TABLE orders 
        ADD COLUMN total_amount DECIMAL(10,2) NOT NULL DEFAULT 0
      `);
      console.log("total_amount column added successfully!");
    } else {
      console.log("total_amount column already exists");
    }

    console.log("Orders table structure fixed!");
    return true;
  } catch (error) {
    console.error("Error fixing orders table:", error);
    throw error;
  }
}
