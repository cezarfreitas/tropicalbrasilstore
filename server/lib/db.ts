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
