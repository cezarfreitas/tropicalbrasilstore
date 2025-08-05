import express from "express";
import path from "path";
import { createServer } from "./index.js";

const app = createServer();

// Production static file serving
const staticPath = path.join(process.cwd(), "dist", "spa");
console.log(`🗂️  Serving static files from: ${staticPath}`);

// Serve the built client files with proper headers for JS and CSS
app.use(express.static(staticPath, {
  setHeaders: (res, path, stat) => {
    if (path.endsWith('.js')) {
      res.set('Content-Type', 'application/javascript');
    }
    if (path.endsWith('.css')) {
      res.set('Content-Type', 'text/css');
    }
  }
}));

// Serve static files for uploads
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "public", "uploads")),
);

// Serve manifest and other assets from public
app.use(express.static(path.join(process.cwd(), "public")));

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

  res.sendFile(path.join(staticPath, "index.html"));
});

const PORT = process.env.PORT || 80;

// Log static path verification
import fs from "fs";
console.log(`🗂️ Static path exists: ${fs.existsSync(staticPath)}`);
if (fs.existsSync(staticPath)) {
  console.log(`📁 Static files:`, fs.readdirSync(staticPath));
  const assetsPath = path.join(staticPath, "assets");
  if (fs.existsSync(assetsPath)) {
    console.log(`📦 Assets files:`, fs.readdirSync(assetsPath));
  }
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Production server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🗂️ Serving static from: ${staticPath}`);
  console.log(
    `💾 Database: ${process.env.DATABASE_URL ? "Connected" : "No URL set"}`,
  );
});
