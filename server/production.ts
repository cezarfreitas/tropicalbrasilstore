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

// Serve uploads FIRST (before any other middleware)
app.use("/uploads", express.static(uploadsPath));

// Serve static files from dist/spa
const staticPath = path.join(__dirname, "../spa");
console.log("📁 Static path:", staticPath);

// CRITICAL: Serve assets with highest priority - BEFORE catch-all route
app.use("/assets/*", (req, res, next) => {
  const filePath = path.join(staticPath, req.path);
  if (fs.existsSync(filePath)) {
    res.setHeader("Cache-Control", "public, max-age=31536000");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.sendFile(filePath);
  } else {
    res.status(404).send("Asset not found");
  }
});

// Serve other static files (manifest.json, favicon, etc.)
app.use(
  express.static(staticPath, {
    maxAge: "1d",
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      }
    },
  }),
);

// API routes should already be handled by createServer()

// SPA routing - serve index.html for all other routes
// This MUST be the LAST route to avoid interfering with assets
app.get("*", (req, res) => {
  // This should only handle SPA routes, not files
  console.log("SPA Route:", req.path);

  const indexPath = path.join(staticPath, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send("App not found");
  }
});

// Start server
app.listen(port, "0.0.0.0", () => {
  console.log(`✅ Server running on http://0.0.0.0:${port}`);
  console.log(`📱 App: http://0.0.0.0:${port}`);
  console.log(`🔌 API: http://0.0.0.0:${port}/api`);
  console.log(`❤️  Health: http://0.0.0.0:${port}/health`);

  // Verify assets exist
  const assetsPath = path.join(staticPath, "assets");
  if (fs.existsSync(assetsPath)) {
    const files = fs.readdirSync(assetsPath);
    console.log(`📦 Assets found: ${files.length} files`);
    files.forEach((file) => console.log(`   - /assets/${file}`));
  } else {
    console.error(`❌ Assets directory not found: ${assetsPath}`);
  }

  console.log("🎉 EasyPanel deployment successful!");
});
