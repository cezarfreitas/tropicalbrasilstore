import mysql from "mysql2/promise";

// Database configuration - Force Tropical Brasil database
const createConnection = () => {
  console.log("🔗 Using Tropical Brasil database connection (FORCED)");
  return mysql.createPool({
    uri: "mysql://tropical:ceb404856425cc1f8472@148.230.78.129:3399/tropical",
    waitForConnections: true,
    connectionLimit: 3,
    queueLimit: 0,
    charset: "utf8mb4",
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
