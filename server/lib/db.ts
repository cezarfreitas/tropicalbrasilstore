import mysql from "mysql2/promise";

<<<<<<< HEAD
// Database configuration with environment variables
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "chinelos_store",
=======
// Database configuration with fallback to environment variables
const dbConfig = {
  // Primary: Use DATABASE_URL if provided
  uri:
    process.env.DATABASE_URL ||
    // Fallback: Use individual environment variables
    `mysql://${process.env.MYSQL_USER || "mysql"}:${process.env.MYSQL_PASSWORD || "eA1mPCW1xwJE31nJOxZixcHdIB68WwQ0Gqe7wAdRw7FqclRQYfOINf7p9vHAAXSN"}@${process.env.MYSQL_HOST || "5.161.52.206"}:${process.env.MYSQL_PORT || "5435"}/${process.env.MYSQL_DATABASE || "default"}`,
>>>>>>> c72c1b6292519beaaf381a21765f20e08bcdca45
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || "10"),
  queueLimit: 0,
<<<<<<< HEAD
  charset: "utf8mb4",
  collation: "utf8mb4_unicode_ci",
};

// Fallback to original URI if environment variables are not set
const connection = process.env.DB_HOST
  ? mysql.createPool(dbConfig)
  : mysql.createPool({
      uri: "mysql://mysql:eA1mPCW1xwJE31nJOxZixcHdIB68WwQ0Gqe7wAdRw7FqclRQYfOINf7p9vHAAXSN@5.161.52.206:5435/default",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
=======
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
};

const connection = mysql.createPool(dbConfig);
>>>>>>> c72c1b6292519beaaf381a21765f20e08bcdca45

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
