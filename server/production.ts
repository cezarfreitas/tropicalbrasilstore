import express from "express";
import path from "path";
import { createServer } from "./index.js";
import fs from "fs";

const app = createServer();

// Production static file serving
const staticPath = path.join(process.cwd(), "dist", "spa");
console.log(`🗂️ Static path: ${staticPath}`);
console.log(`📁 Static path exists: ${fs.existsSync(staticPath)}`);

// Log static files for debugging
if (fs.existsSync(staticPath)) {
  console.log(`📄 Static files:`, fs.readdirSync(staticPath));
  const assetsPath = path.join(staticPath, "assets");
  if (fs.existsSync(assetsPath)) {
    console.log(`📦 Assets:`, fs.readdirSync(assetsPath));

    // Log each asset file size
    fs.readdirSync(assetsPath).forEach((file) => {
      const filePath = path.join(assetsPath, file);
      const stats = fs.statSync(filePath);
      console.log(`📄 ${file}: ${stats.size} bytes`);
    });
  }
} else {
  console.error(`❌ Static path does not exist: ${staticPath}`);
}

// Simple request logging for assets
app.use((req, res, next) => {
  if (req.path.startsWith("/assets/") || req.path === "/") {
    console.log(`🌐 ${req.method} ${req.path}`);
  }
  next();
});

// Headers compatibility middleware for nginx/proxy
app.use((req, res, next) => {
  // Permissive CSP headers for EasyPanel
  res.set({
    'Content-Security-Policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  });
  next();
});

// Serve static files from spa directory (this handles /assets automatically)
app.use(
  express.static(staticPath, {
    setHeaders: (res, filePath) => {
      // Use text/javascript for better proxy compatibility
      if (filePath.endsWith(".js")) {
        res.set({
          "Content-Type": "text/javascript; charset=utf-8",
          "Cache-Control": "public, max-age=31536000",
          "Access-Control-Allow-Origin": "*",
          "X-Content-Type-Options": "nosniff"
        });
      }
      if (filePath.endsWith(".css")) {
        res.set({
          "Content-Type": "text/css; charset=utf-8",
          "Cache-Control": "public, max-age=31536000"
        });
      }
    },
  }),
);

// Serve uploads directory
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "public", "uploads")),
);

// Serve public files (manifest, etc)
app.use(express.static(path.join(process.cwd(), "public")));

// Debug endpoint
app.get("/debug/status", (req, res) => {
  const indexPath = path.join(staticPath, "index.html");
  const assetsPath = path.join(staticPath, "assets");

  const debugInfo = {
    status: "ok",
    timestamp: new Date().toISOString(),
    staticPath,
    staticExists: fs.existsSync(staticPath),
    indexExists: fs.existsSync(indexPath),
    assetsExists: fs.existsSync(assetsPath),
    staticFiles: fs.existsSync(staticPath) ? fs.readdirSync(staticPath) : [],
    assetFiles: fs.existsSync(assetsPath) ? fs.readdirSync(assetsPath) : [],
  };

  res.json(debugInfo);
});

// SPA fallback - serve index.html for all non-API routes
app.get("*", (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "API route not found" });
  }

  // Don't serve index.html for uploads
  if (req.path.startsWith("/uploads/")) {
    return res.status(404).json({ error: "Upload not found" });
  }

  // Serve index.html for all other routes (SPA routing)
  const indexPath = path.join(staticPath, "index.html");
  console.log(`📄 Serving index.html for: ${req.path}`);
  res.sendFile(indexPath);
});

const PORT = process.env.PORT || 80;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Production server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🗂️ Serving static from: ${staticPath}`);
});
