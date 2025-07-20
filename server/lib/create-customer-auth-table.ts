import db from "./db";

export async function createCustomerAuthTable() {
  try {
    console.log("Creating customer authentication schema...");

    // First, create a new customer_auth table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS customer_auth (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        whatsapp VARCHAR(20) NOT NULL UNIQUE,
        password VARCHAR(255) DEFAULT NULL,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        is_first_login BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_whatsapp (whatsapp),
        INDEX idx_status (status)
      )
    `);

    // Check if we need to migrate data from existing customers table
    const [existingCustomers] = await db.execute(`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_schema = DATABASE() AND table_name = 'customers'
    `);

    if ((existingCustomers as any)[0].count > 0) {
      // Migrate existing customer data to customer_auth with approved status
      await db.execute(`
        INSERT IGNORE INTO customer_auth (name, email, whatsapp, status, is_first_login)
        SELECT name, email, whatsapp, 'approved', FALSE
        FROM customers
        WHERE email IS NOT NULL AND whatsapp IS NOT NULL
      `);

      console.log("Migrated existing customers to customer_auth table");
    }

    console.log("Customer authentication schema created successfully!");
    return true;
  } catch (error) {
    console.error("Error creating customer authentication schema:", error);
    throw error;
  }
}
