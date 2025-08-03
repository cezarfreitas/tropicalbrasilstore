#!/usr/bin/env node

// Minimal server for debugging EasyPanel deployment
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = process.env.PORT || 3000;

console.log("🚀 Starting minimal server...");
console.log(`📋 Port: ${port}`);
console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);

const app = express();

// Basic middleware
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    port: port,
    environment: process.env.NODE_ENV || "development",
  });
});

// Basic API endpoint
app.get("/api/ping", (req, res) => {
  res.json({ message: "pong", server: "minimal" });
});

// Serve static files if they exist
try {
  const staticPath = path.join(__dirname, "../dist/spa");
  console.log(`📁 Trying to serve static files from: ${staticPath}`);

  app.use(express.static(staticPath));

  // SPA routing
  app.get("*", (req, res) => {
    if (req.path.startsWith("/api/")) {
      return res.status(404).json({ error: "API endpoint not found" });
    }
    res.sendFile(path.join(staticPath, "index.html"));
  });

  console.log("✅ Static files configured");
} catch (error) {
  console.error("⚠️ Could not configure static files:", error.message);

  // Fallback route
  app.get("*", (req, res) => {
    res.send(`
      <html>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>🎉 Minimal Server Running!</h1>
          <p>Port: ${port}</p>
          <p>Environment: ${process.env.NODE_ENV || "development"}</p>
          <p>Time: ${new Date().toISOString()}</p>
          <a href="/health">Health Check</a> | 
          <a href="/api/ping">API Test</a>
        </body>
      </html>
    `);
  });
}

// Start server
try {
  app.listen(port, "0.0.0.0", () => {
    console.log(`✅ Minimal server running on http://0.0.0.0:${port}`);
    console.log(`🏥 Health check: http://0.0.0.0:${port}/health`);
    console.log(`🔌 API test: http://0.0.0.0:${port}/api/ping`);
    console.log("🎉 Server started successfully!");
  });
} catch (error) {
  console.error("❌ Failed to start server:", error);
  process.exit(1);
}

// Error handlers
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});
