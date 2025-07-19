import db from "./db";

export async function checkAndFixTables() {
  try {
    console.log("Checking table structures...");

    // Check customers table structure
    const [customerColumns] = await db.execute(`
      SELECT COLUMN_NAME, COLUMN_DEFAULT, IS_NULLABLE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'customers'
      ORDER BY ORDINAL_POSITION
    `);

    console.log("Customers table columns:", customerColumns);

    // Check orders table structure
    const [orderColumns] = await db.execute(`
      SELECT COLUMN_NAME, COLUMN_DEFAULT, IS_NULLABLE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'orders'
      ORDER BY ORDINAL_POSITION
    `);

    console.log("Orders table columns:", orderColumns);

    // Check order_items table structure
    const [orderItemColumns] = await db.execute(`
      SELECT COLUMN_NAME, COLUMN_DEFAULT, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'order_items'
      ORDER BY ORDINAL_POSITION
    `);

    console.log("Order_items table columns:", orderItemColumns);

    // Check if grade_id column exists in order_items
    const orderItemCols = orderItemColumns as any[];
    const hasGradeId = orderItemCols.some(
      (col) => col.COLUMN_NAME === "grade_id",
    );

    if (!hasGradeId) {
      console.log("Adding grade_id column to order_items table...");
      await db.execute(`
        ALTER TABLE order_items
        ADD COLUMN grade_id INT NULL,
        ADD FOREIGN KEY (grade_id) REFERENCES grade_vendida(id) ON DELETE SET NULL
      `);
      console.log("grade_id column added to order_items!");
    }

    // Make size_id nullable for grade purchases
    const sizeIdCol = orderItemCols.find(
      (col) => col.COLUMN_NAME === "size_id",
    );
    if (sizeIdCol && sizeIdCol.IS_NULLABLE === "NO") {
      console.log("Making size_id column nullable for grade purchases...");
      await db.execute(`
        ALTER TABLE order_items
        MODIFY COLUMN size_id INT NULL
      `);
      console.log("size_id column is now nullable!");
    }

    // Check if there are any problematic columns and fix them
    const customerCols = customerColumns as any[];
    const hasCustomerName = customerCols.some(
      (col) => col.COLUMN_NAME === "customer_name",
    );

    if (hasCustomerName) {
      console.log("Found problematic customer_name column, removing it...");
      await db.execute(`ALTER TABLE customers DROP COLUMN customer_name`);
      console.log("customer_name column removed!");
    }

    return true;
  } catch (error) {
    console.error("Error checking tables:", error);
    throw error;
  }
}
