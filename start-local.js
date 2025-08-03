#!/usr/bin/env node

import { createServer } from "./server/index.js";
import path from "path";
import express from "express";
import fs from "fs";
import { fileURLToPath } from "url";

console.log("🚀 Starting LOCAL Windows Server");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use development server for local Windows
const app = createServer();
const port = process.env.PORT || 3000;

// Check if dist exists, if not build first
const distPath = path.join(__dirname, "dist");
if (!fs.existsSync(distPath)) {
  console.log("❌ Build not found. Run 'npm run build' first!");
  process.exit(1);
}

// Serve static files from dist/spa
const staticPath = path.join(__dirname, "dist", "spa");
console.log("📁 Static path:", staticPath);

if (!fs.existsSync(staticPath)) {
  console.log("❌ SPA build not found at:", staticPath);
  console.log("Run 'npm run build' first!");
  process.exit(1);
}

// Serve uploads
app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")));

// Serve assets
app.use(
  "/assets",
  express.static(path.join(staticPath, "assets"), {
    maxAge: "1d",
    setHeaders: (res, filePath) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
    },
  }),
);

// Serve other static files
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

// SPA routing
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }

  const indexPath = path.join(staticPath, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send("App not found");
  }
});

app.listen(port, () => {
  console.log(`✅ Local server running on http://localhost:${port}`);
  console.log(`📱 App: http://localhost:${port}`);
  console.log(`🔧 API: http://localhost:${port}/api`);

  // Verify files exist
  const indexPath = path.join(staticPath, "index.html");
  const assetsPath = path.join(staticPath, "assets");

  console.log(`📄 Index: ${fs.existsSync(indexPath) ? "✅" : "❌"}`);
  console.log(`📦 Assets: ${fs.existsSync(assetsPath) ? "✅" : "❌"}`);

  if (fs.existsSync(assetsPath)) {
    const files = fs.readdirSync(assetsPath);
    console.log(`📦 Assets found: ${files.length} files`);
  }
});
