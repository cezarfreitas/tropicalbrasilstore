import db from "./db";

export async function createApiLogsTable() {
  try {
    console.log("🔄 Creating API logs table...");

    await db.execute(`
      CREATE TABLE IF NOT EXISTS api_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        method VARCHAR(10) NOT NULL,
        endpoint VARCHAR(255) NOT NULL,
        user_agent TEXT,
        ip_address VARCHAR(45),
        request_headers JSON,
        request_body JSON,
        response_status INT,
        response_time_ms INT,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_endpoint (endpoint),
        INDEX idx_method (method),
        INDEX idx_created_at (created_at),
        INDEX idx_status (response_status)
      )
    `);

    console.log("✅ API logs table created successfully!");
    return true;
  } catch (error) {
    console.error("❌ Error creating API logs table:", error);
    throw error;
  }
}
