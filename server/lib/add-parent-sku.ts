import db from "./db";

export async function addParentSkuColumn() {
  try {
    console.log("Adding parent_sku column to products table...");

    // Check if column already exists
    const [columns] = await db.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'products' 
      AND COLUMN_NAME = 'parent_sku'
    `);

    if ((columns as any[]).length === 0) {
      // Add the column
      await db.execute(`
        ALTER TABLE products 
        ADD COLUMN parent_sku VARCHAR(100) NULL COMMENT 'SKU do produto pai para agrupamento de variantes'
      `);
      console.log("✅ parent_sku column added successfully!");
    } else {
      console.log("ℹ��� parent_sku column already exists");
    }

    // Add index for better performance on grouping queries
    try {
      await db.execute(`
        CREATE INDEX idx_parent_sku ON products(parent_sku)
      `);
      console.log("✅ parent_sku index created successfully!");
    } catch (error: any) {
      if (error.code !== "ER_DUP_KEYNAME") {
        console.log(
          "ℹ️ parent_sku index already exists or error:",
          error.message,
        );
      }
    }

    return true;
  } catch (error) {
    console.error("❌ Error adding parent_sku column:", error);
    throw error;
  }
}
