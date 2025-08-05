import express from "express";
import path from "path";
import { createServer } from "./index.js";

const app = createServer();

// Production static file serving
const staticPath = path.join(process.cwd(), "dist", "spa");
console.log(`🗂️  Serving static files from: ${staticPath}`);

// Security and CORS headers for production
app.use((req, res, next) => {
  // Security headers
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  });

  // CORS headers for assets
  if (req.path.startsWith("/assets/") || req.path.endsWith(".js") || req.path.endsWith(".css")) {
    res.set({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
      'Cross-Origin-Resource-Policy': 'cross-origin',
    });
  }

  console.log(`🌐 Request: ${req.method} ${req.path}`);
  next();
});

// Serve the built client files with proper headers for JS and CSS
app.use(
  express.static(staticPath, {
    setHeaders: (res, filePath, stat) => {
      // Enhanced headers for JavaScript modules
      if (filePath.endsWith(".js")) {
        res.set({
          "Content-Type": "application/javascript; charset=utf-8",
          "Cache-Control": "public, max-age=31536000, immutable",
          "Cross-Origin-Embedder-Policy": "unsafe-none",
          "Cross-Origin-Opener-Policy": "same-origin",
        });
      }

      // CSS headers
      if (filePath.endsWith(".css")) {
        res.set({
          "Content-Type": "text/css; charset=utf-8",
          "Cache-Control": "public, max-age=31536000, immutable",
        });
      }

      // General asset headers
      res.set({
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        "Vary": "Accept-Encoding",
      });
    },
    maxAge: "1y",
    immutable: true,
    etag: true,
    lastModified: true,
  }),
);

// Serve static files for uploads
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "public", "uploads")),
);

// Serve manifest and other assets from public
app.use(express.static(path.join(process.cwd(), "public")));

// Explicit handler for assets - ensure they're served correctly
app.get("/assets/*", (req, res, next) => {
  const filePath = path.join(staticPath, req.path);
  console.log(`🎯 Direct asset request: ${req.path} -> ${filePath}`);

  if (fs.existsSync(filePath)) {
    if (req.path.endsWith(".js")) {
      res.set("Content-Type", "application/javascript; charset=utf-8");
    } else if (req.path.endsWith(".css")) {
      res.set("Content-Type", "text/css; charset=utf-8");
    }
    res.sendFile(filePath);
  } else {
    console.log(`❌ Asset not found: ${filePath}`);
    res.status(404).json({ error: "Asset not found" });
  }
});

// Debug endpoint for EasyPanel
app.get("/debug/status", (req, res) => {
  const indexPath = path.join(staticPath, "index.html");
  const assetsPath = path.join(staticPath, "assets");

  res.json({
    status: "ok",
    staticPath,
    indexExists: fs.existsSync(indexPath),
    assetsExists: fs.existsSync(assetsPath),
    assets: fs.existsSync(assetsPath) ? fs.readdirSync(assetsPath) : [],
    indexContent: fs.existsSync(indexPath) ? fs.readFileSync(indexPath, 'utf8').substring(0, 500) + "..." : "NOT FOUND",
    timestamp: new Date().toISOString(),
  });
});

// Catch-all handler for SPA routing
app.get("*", (req, res) => {
  // Don't serve index.html for API routes or uploads
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "Not Found" });
  }

  // Don't intercept upload routes - they are handled by static middleware above
  if (req.path.startsWith("/uploads/")) {
    return res.status(404).json({ error: "File not found" });
  }

  // Don't intercept asset files
  if (req.path.startsWith("/assets/")) {
    return res.status(404).json({ error: "Asset not found" });
  }

  // Enhanced HTML serving with proper headers
  const indexPath = path.join(staticPath, "index.html");

  if (fs.existsSync(indexPath)) {
    res.set({
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    });
    res.sendFile(indexPath);
  } else {
    console.error(`❌ Index.html not found at: ${indexPath}`);
    res.status(404).send("Index file not found");
  }
});

const PORT = process.env.PORT || 80;

// Log static path verification with detailed info
import fs from "fs";
console.log(`🗂️ Static path: ${staticPath}`);
console.log(`📁 Static path exists: ${fs.existsSync(staticPath)}`);
console.log(`📁 Current working directory: ${process.cwd()}`);

if (fs.existsSync(staticPath)) {
  const staticFiles = fs.readdirSync(staticPath);
  console.log(`📄 Static files:`, staticFiles);

  const assetsPath = path.join(staticPath, "assets");
  console.log(`📦 Assets path: ${assetsPath}`);
  console.log(`📦 Assets path exists: ${fs.existsSync(assetsPath)}`);

  if (fs.existsSync(assetsPath)) {
    const assetFiles = fs.readdirSync(assetsPath);
    console.log(`📦 Assets files:`, assetFiles);

    // Check specific file
    assetFiles.forEach(file => {
      const filePath = path.join(assetsPath, file);
      const stats = fs.statSync(filePath);
      console.log(`📄 ${file}: ${stats.size} bytes, ${stats.mode.toString(8)}`);
    });
  }
} else {
  // Try alternative paths
  const altPaths = [
    path.join(process.cwd(), "spa"),
    path.join(process.cwd(), "client", "dist"),
    path.join(process.cwd(), "build"),
  ];

  altPaths.forEach(altPath => {
    console.log(`🔍 Checking alternative path: ${altPath} - exists: ${fs.existsSync(altPath)}`);
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Production server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🗂️ Serving static from: ${staticPath}`);
  console.log(
    `💾 Database: ${process.env.DATABASE_URL ? "Connected" : "No URL set"}`,
  );
});
