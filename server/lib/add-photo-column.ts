import db from "./db";

export async function addPhotoColumn() {
  try {
    console.log("Adding photo column to products table...");

    // Check if column already exists
    const [columns] = await db.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'products' 
      AND COLUMN_NAME = 'photo'
    `);

    if ((columns as any[]).length === 0) {
      // Add the column
      await db.execute(`
        ALTER TABLE products 
        ADD COLUMN photo VARCHAR(500) NULL
      `);
      console.log("✅ photo column added successfully!");
    } else {
      console.log("ℹ️ photo column already exists");
    }

    return true;
  } catch (error) {
    console.error("❌ Error adding photo column:", error);
    throw error;
  }
}
