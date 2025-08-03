import mysql from "mysql2/promise";

// Database configuration with multiple fallback options
const createConnection = () => {
  // Option 1: Use DATABASE_URL if provided (for cloud platforms)
  if (process.env.DATABASE_URL) {
    return mysql.createPool({
      uri: process.env.DATABASE_URL,
      waitForConnections: true,
      connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || "3"),
      queueLimit: 0,
      charset: "utf8mb4",
    });
  }

  // Option 2: Use individual MYSQL_* environment variables
  if (process.env.MYSQL_HOST) {
    return mysql.createPool({
      host: process.env.MYSQL_HOST,
      port: parseInt(process.env.MYSQL_PORT || "3306"),
      user: process.env.MYSQL_USER || "mysql",
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE || "default",
      waitForConnections: true,
      connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || "3"),
      queueLimit: 0,
      charset: "utf8mb4",
    });
  }

  // Option 3: Use Docker-style DB_* environment variables
  if (process.env.DB_HOST) {
    return mysql.createPool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || "3306"),
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "chinelos_store",
      waitForConnections: true,
      connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || "3"),
      queueLimit: 0,
      charset: "utf8mb4",
    });
  }

  // Fallback: Use original connection string for development
  console.log("Using fallback database configuration");
  return mysql.createPool({
    uri: "mysql://mysql:eA1mPCW1xwJE31nJOxZixcHdIB68WwQ0Gqe7wAdRw7FqclRQYfOINf7p9vHAAXSN@5.161.52.206:5435/default",
    waitForConnections: true,
    connectionLimit: 3,
    queueLimit: 0,
  });
};

const connection = createConnection();

export default connection;

export async function initDatabase() {
  try {
    // Check if tables exist
    const [tables] = await connection.execute(
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'categories'",
    );

    const tableExists = (tables as any)[0].count > 0;

    if (!tableExists) {
      console.log(
        "Tables don't exist, initializing database with sample data...",
      );
      const { seedDatabase } = await import("./seed");
      await seedDatabase();
    } else {
      console.log("Database tables already exist");
    }
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}
