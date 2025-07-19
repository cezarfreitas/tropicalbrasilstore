import mysql from "mysql2/promise";

const connection = mysql.createPool({
  uri: "mysql://mysql:eA1mPCW1xwJE31nJOxZixcHdIB68WwQ0Gqe7wAdRw7FqclRQYfOINf7p9vHAAXSN@5.161.52.206:5435/default",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default connection;

export async function initDatabase() {
  try {
    // Create categories table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create sizes table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS sizes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        size VARCHAR(50) NOT NULL UNIQUE,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create colors table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS colors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        hex_code VARCHAR(7),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create products table without foreign key initially
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category_id INT,
        base_price DECIMAL(10,2),
        sku VARCHAR(100) UNIQUE,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create grade_vendida (kit) table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS grade_vendida (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        total_price DECIMAL(10,2),
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create grade_items table without foreign keys initially
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS grade_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        grade_id INT NOT NULL,
        product_id INT NOT NULL,
        size_id INT NOT NULL,
        color_id INT NOT NULL,
        quantity INT NOT NULL
      )
    `);

    console.log("Database tables initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}
