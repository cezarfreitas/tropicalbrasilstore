import path from "path";
import * as express from "express";
import fs from "fs";
import { createServer } from "./index";
import { fileURLToPath } from "url";

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

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
console.log("📁 Serving static files from:", staticPath);

// CRITICAL: Serve assets with explicit route first to prevent catch-all interference
app.use('/assets', express.static(path.join(staticPath, 'assets'), {
  maxAge: '1y',
  setHeaders: (res, path) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
  }
}));

// Serve other static files (manifest, favicon, etc.)
app.use(express.static(staticPath, {
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: port
  });
});

// Serve index.html for all non-API and non-asset routes (SPA routing)
// This MUST be the last route to avoid interfering with static assets
app.get("*", (req, res) => {
  // Skip API routes (they should already be handled above)
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }

  // Skip asset files and other static files
  if (req.path.startsWith("/assets/") || 
      req.path.startsWith("/uploads/") ||
      req.path.includes('.js') ||
      req.path.includes('.css') ||
      req.path.includes('.ico') ||
      req.path.includes('.png') ||
      req.path.includes('.jpg') ||
      req.path.includes('.svg')) {
    return res.status(404).send('Asset not found');
  }

  // Serve index.html for all other routes (SPA routing)
  const indexPath = path.join(staticPath, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Application not found');
  }
});

// Start server with better container support
console.log("🚀 Starting server...");
console.log(`📋 Port: ${port}`);
console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
console.log(`📁 Static path: ${staticPath}`);
console.log(`📁 Assets path: ${path.join(staticPath, 'assets')}`);

try {
  app.listen(port, "0.0.0.0", () => {
    console.log(`✅ Server running on http://0.0.0.0:${port}`);
    console.log(`📱 Frontend: http://0.0.0.0:${port}`);
    console.log(`🔌 API: http://0.0.0.0:${port}/api`);
    console.log(`❤️  Health check: http://0.0.0.0:${port}/health`);
    console.log("🎉 Application started successfully!");
    
    // Verify static files exist
    const assetsPath = path.join(staticPath, 'assets');
    if (fs.existsSync(assetsPath)) {
      const files = fs.readdirSync(assetsPath);
      console.log(`📦 Assets found: ${files.length} files`);
      files.forEach(file => console.log(`   - ${file}`));
    } else {
      console.log(`⚠️  Assets directory not found: ${assetsPath}`);
    }
  });
} catch (error) {
  console.error("❌ Failed to start server:", error);
  process.exit(1);
}
