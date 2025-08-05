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
  }
}

// Simple request logging
app.use((req, res, next) => {
  if (req.path.startsWith("/assets/") || req.path === "/") {
    console.log(`🌐 ${req.method} ${req.path}`);
  }
  next();
});

// Serve static files from spa directory
app.use(express.static(staticPath, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith(".js")) {
      res.set("Content-Type", "application/javascript; charset=utf-8");
    }
    if (filePath.endsWith(".css")) {
      res.set("Content-Type", "text/css; charset=utf-8");
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

// Explicit handler for assets - ensure they're served correctly
app.get("/assets/*", (req, res, next) => {
  const filePath = path.join(staticPath, req.path);
  const fileName = path.basename(req.path);

  console.log(`🎯 ASSET REQUEST: ${req.path}`);
  console.log(`📁 Full path: ${filePath}`);
  console.log(`📋 File exists: ${fs.existsSync(filePath)}`);

  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`✅ File found: ${fileName} (${stats.size} bytes)`);

    if (req.path.endsWith(".js")) {
      res.set("Content-Type", "application/javascript; charset=utf-8");
    } else if (req.path.endsWith(".css")) {
      res.set("Content-Type", "text/css; charset=utf-8");
    }

    res.sendFile(filePath);
  } else {
    console.log(`❌ Asset not found: ${filePath}`);

    // List what files actually exist in assets directory
    const assetsDir = path.join(staticPath, "assets");
    if (fs.existsSync(assetsDir)) {
      const availableFiles = fs.readdirSync(assetsDir);
      console.log(`📂 Available assets:`, availableFiles);
    } else {
      console.log(`📂 Assets directory does not exist: ${assetsDir}`);
    }

    res.status(404).json({
      error: "Asset not found",
      requested: req.path,
      fullPath: filePath,
      staticPath: staticPath,
    });
  }
});

// Debug endpoint for EasyPanel
app.get("/debug/status", (req, res) => {
  const indexPath = path.join(staticPath, "index.html");
  const assetsPath = path.join(staticPath, "assets");

  const debugInfo = {
    status: "ok",
    timestamp: new Date().toISOString(),
    paths: {
      cwd: process.cwd(),
      staticPath,
      indexPath,
      assetsPath,
    },
    existence: {
      staticPathExists: fs.existsSync(staticPath),
      indexExists: fs.existsSync(indexPath),
      assetsExists: fs.existsSync(assetsPath),
    },
    files: {},
    permissions: {},
  };

  // List static directory
  if (fs.existsSync(staticPath)) {
    debugInfo.files.staticDir = fs.readdirSync(staticPath);
  }

  // List assets directory
  if (fs.existsSync(assetsPath)) {
    const assetFiles = fs.readdirSync(assetsPath);
    debugInfo.files.assets = assetFiles;

    // Get file stats
    debugInfo.files.assetDetails = assetFiles.map((file) => {
      const filePath = path.join(assetsPath, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        size: stats.size,
        mode: stats.mode.toString(8),
        readable: fs.constants.R_OK & stats.mode ? true : false,
      };
    });
  }

  // Check index.html content
  if (fs.existsSync(indexPath)) {
    const content = fs.readFileSync(indexPath, "utf8");
    debugInfo.files.indexContent = content.substring(0, 1000);
    debugInfo.files.indexSize = content.length;
  }

  // Try to find dist directory structure
  const distPath = path.join(process.cwd(), "dist");
  if (fs.existsSync(distPath)) {
    debugInfo.files.distStructure = getDirectoryStructure(distPath);
  }

  res.json(debugInfo);
});

// Helper function to get directory structure
function getDirectoryStructure(dirPath, maxDepth = 3, currentDepth = 0) {
  if (currentDepth >= maxDepth) return "...";

  try {
    const items = fs.readdirSync(dirPath);
    const structure = {};

    items.forEach((item) => {
      const itemPath = path.join(dirPath, item);
      const stats = fs.statSync(itemPath);

      if (stats.isDirectory()) {
        structure[item + "/"] = getDirectoryStructure(
          itemPath,
          maxDepth,
          currentDepth + 1,
        );
      } else {
        structure[item] = `${stats.size} bytes`;
      }
    });

    return structure;
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

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
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
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
  console.log(`���� Static files:`, staticFiles);

  const assetsPath = path.join(staticPath, "assets");
  console.log(`📦 Assets path: ${assetsPath}`);
  console.log(`📦 Assets path exists: ${fs.existsSync(assetsPath)}`);

  if (fs.existsSync(assetsPath)) {
    const assetFiles = fs.readdirSync(assetsPath);
    console.log(`📦 Assets files:`, assetFiles);

    // Check specific file
    assetFiles.forEach((file) => {
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

  altPaths.forEach((altPath) => {
    console.log(
      `🔍 Checking alternative path: ${altPath} - exists: ${fs.existsSync(altPath)}`,
    );
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
