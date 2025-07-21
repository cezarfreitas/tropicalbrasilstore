import db from "./db";

export async function addSalePriceColumn() {
  try {
    // Check if sale_price column exists
    const [columns] = await db.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'products' 
      AND COLUMN_NAME = 'sale_price'
    `);

    if ((columns as any[]).length === 0) {
      // Add the sale_price column
      await db.execute(`
        ALTER TABLE products 
        ADD COLUMN sale_price DECIMAL(10,2) DEFAULT NULL 
        COMMENT 'Final selling price to customers'
      `);
      console.log("✓ sale_price column added to products table");
    } else {
      console.log("ℹ️ sale_price column already exists");
    }
  } catch (error) {
    console.error("Error adding sale_price column:", error);
    throw error;
  }
}
