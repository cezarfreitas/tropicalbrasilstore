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
