import db from "./db";

export async function createStoreSettingsTable() {
  try {
    // Check if store_settings table exists
    const [tables] = await db.execute(`
      SELECT TABLE_NAME
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'store_settings'
    `);

    if ((tables as any[]).length > 0) {
      console.log("✅ store_settings table already exists");
      return;
    }

    console.log("📦 Creating store_settings table...");

    await db.execute(`
      CREATE TABLE store_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        store_name VARCHAR(255) NOT NULL DEFAULT 'Chinelos Store',
        store_description TEXT,
        contact_email VARCHAR(255),
        contact_phone VARCHAR(50),
        contact_whatsapp VARCHAR(50),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(50),
        postal_code VARCHAR(20),
        shipping_fee DECIMAL(10, 2) DEFAULT 15.00,
        free_shipping_threshold DECIMAL(10, 2) DEFAULT 150.00,
        payment_methods JSON,
        social_instagram VARCHAR(255),
        social_facebook VARCHAR(255),
        logo_url TEXT,
        banner_url TEXT,
        maintenance_mode BOOLEAN DEFAULT FALSE,
        allow_orders BOOLEAN DEFAULT TRUE,
        tax_rate DECIMAL(5, 4) DEFAULT 0.0000,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    console.log("✅ store_settings table created successfully!");
  } catch (error) {
    console.error("❌ Error creating store_settings table:", error);
    throw error;
  }
}
