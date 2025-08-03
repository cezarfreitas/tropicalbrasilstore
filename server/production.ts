import path from "path";
import express from "express";
import fs from "fs";
import { createServer } from "./index";
import { fileURLToPath } from "url";

// Handle errors
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection:", reason);
  process.exit(1);
});

// Port 80 for EasyPanel
const port = process.env.PORT || 80;

console.log("🚀 Starting EasyPanel Production Server");
console.log(`📋 Port: ${port}`);
console.log(`🌍 Environment: ${process.env.NODE_ENV || "production"}`);

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
let app;
try {
  app = createServer();
  console.log("✅ Express server created");
} catch (error) {
  console.error("❌ Failed to create server:", error);
  process.exit(1);
}

// Create uploads directory
const uploadsPath = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
  fs.mkdirSync(path.join(uploadsPath, "logos"), { recursive: true });
  fs.mkdirSync(path.join(uploadsPath, "products"), { recursive: true });
  console.log("📁 Created uploads directories");
}

// Serve uploads
app.use("/uploads", express.static(uploadsPath));

// Serve static files from dist/spa
const staticPath = path.join(__dirname, "../spa");
console.log("📁 Static path:", staticPath);

// Serve assets explicitly
app.use('/assets', express.static(path.join(staticPath, 'assets'), {
  maxAge: '1y',
  setHeaders: (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
}));

// Serve other static files
app.use(express.static(staticPath));

// SPA routing - serve index.html for non-API routes
app.get("*", (req, res) => {
  // Skip API routes
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }

  // Skip assets
  if (req.path.startsWith("/assets/") || 
      req.path.startsWith("/uploads/") ||
      req.path.includes('.')) {
    return res.status(404).send('File not found');
  }

  // Serve index.html for SPA routes
  const indexPath = path.join(staticPath, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('App not found');
  }
});

// Start server
app.listen(port, "0.0.0.0", () => {
  console.log(`✅ Server running on http://0.0.0.0:${port}`);
  console.log(`📱 App: http://0.0.0.0:${port}`);
  console.log(`🔌 API: http://0.0.0.0:${port}/api`);
  console.log(`❤️  Health: http://0.0.0.0:${port}/health`);
  console.log("🎉 EasyPanel deployment successful!");
});
