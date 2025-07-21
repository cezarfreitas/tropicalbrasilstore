import db from "./db";

export async function addParentIdColumn() {
  try {
    // Check if parent_id column already exists
    const [columns] = await db.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'products' 
      AND COLUMN_NAME = 'parent_id'
      AND TABLE_SCHEMA = DATABASE()
    `);

    if ((columns as any[]).length === 0) {
      // Add parent_id column
      await db.execute(`
        ALTER TABLE products 
        ADD COLUMN parent_id INT NULL,
        ADD FOREIGN KEY (parent_id) REFERENCES products(id) ON DELETE SET NULL
      `);
      console.log("✅ parent_id column added to products table");
    } else {
      console.log("ℹ️ parent_id column already exists");
    }
  } catch (error) {
    console.error("❌ Error adding parent_id column:", error);
  }
}
