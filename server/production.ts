import path from "path";
import * as express from "express";
import fs from "fs";
import { createServer } from "./index";
import { fileURLToPath } from "url";

const port = process.env.PORT || 3000;

// Production environment checks (minimal logging for faster startup)
if (process.env.NODE_ENV === "production") {
  console.log("🌍 Production mode enabled");
}

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app with error handling
let app;
try {
  console.log("🔧 Creating Express server...");
  app = createServer();
  console.log("✅ Express server created successfully");
} catch (error) {
  console.error("❌ Failed to create Express server:", error);
  process.exit(1);
}

// Ensure uploads directory exists in production
const uploadsPath = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
  fs.mkdirSync(path.join(uploadsPath, "logos"), { recursive: true });
  fs.mkdirSync(path.join(uploadsPath, "products"), { recursive: true });
  console.log("📁 Created uploads directories in production");
}

// Serve uploads directory (must be before SPA static files)
app.use("/uploads", express.static(uploadsPath));
console.log("📁 Serving uploads from:", uploadsPath);

// Serve static files from the dist/spa directory
const staticPath = path.join(__dirname, "../spa");
console.log("�� Serving static files from:", staticPath);

app.use(express.static(staticPath));

// Serve index.html for all non-API routes (SPA routing)
// This must be AFTER all API routes are registered
app.get("*", (req, res) => {
  // Skip API routes (they should already be handled above)
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }

  // Serve index.html for all other routes
  res.sendFile(path.join(staticPath, "index.html"));
});

// Start server with better container support
console.log("🚀 Starting server...");
console.log(`📋 Port: ${port}`);
console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);

try {
  app.listen(port, "0.0.0.0", () => {
    console.log(`✅ Server running on http://0.0.0.0:${port}`);
    console.log(`📱 Frontend: http://0.0.0.0:${port}`);
    console.log(`🔌 API: http://0.0.0.0:${port}/api`);
    console.log(`❤️  Health check: http://0.0.0.0:${port}/health`);
    console.log("🎉 Application started successfully!");
  });
} catch (error) {
  console.error("❌ Failed to start server:", error);
  process.exit(1);
}
