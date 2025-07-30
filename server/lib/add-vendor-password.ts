import db from "./db";
import bcrypt from "bcryptjs";

export async function addVendorPassword() {
  try {
    // Check if password column exists
    const [columns] = await db.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'vendors' 
      AND COLUMN_NAME = 'password'
      AND TABLE_SCHEMA = DATABASE()
    `);

    if ((columns as any[]).length === 0) {
      console.log("Adding password column to vendors table...");
      
      // Add password column
      await db.execute(`
        ALTER TABLE vendors 
        ADD COLUMN password VARCHAR(255) AFTER email
      `);

      // Set default password for existing vendors
      const defaultPassword = await bcrypt.hash("123456", 10);
      await db.execute(`
        UPDATE vendors 
        SET password = ? 
        WHERE password IS NULL
      `, [defaultPassword]);

      console.log("✅ Password column added to vendors table");
      console.log("ℹ️  Default password for existing vendors: 123456");
    }

    // Check if last_login column exists
    const [lastLoginColumns] = await db.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'vendors' 
      AND COLUMN_NAME = 'last_login'
      AND TABLE_SCHEMA = DATABASE()
    `);

    if ((lastLoginColumns as any[]).length === 0) {
      console.log("Adding last_login column to vendors table...");
      
      await db.execute(`
        ALTER TABLE vendors 
        ADD COLUMN last_login TIMESTAMP NULL AFTER active
      `);

      console.log("✅ last_login column added to vendors table");
    }

  } catch (error) {
    console.error("Error adding vendor password column:", error);
    throw error;
  }
}
