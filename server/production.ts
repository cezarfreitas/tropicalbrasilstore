import path from "path";
import * as express from "express";
import { createServer } from "./index";
import { fileURLToPath } from "url";

const port = process.env.PORT || 3000;

// Production environment checks
if (process.env.NODE_ENV === "production") {
  console.log("🌍 Production mode enabled");
  console.log(
    "📊 Database configured:",
    process.env.DATABASE_URL || process.env.MYSQL_HOST || process.env.DB_HOST ? "✅" : "❌",
  );
}

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = createServer();

// Serve static files from the dist/spa directory
const staticPath = path.join(__dirname, "../spa");
console.log("�� Serving static files from:", staticPath);

app.use(express.static(staticPath));

// Serve index.html for all non-API routes (SPA routing)
app.get("*", (req, res, next) => {
  // Skip API routes
  if (req.path.startsWith("/api/")) {
    return next();
  }

  // Serve index.html for all other routes
  res.sendFile(path.join(staticPath, "index.html"));
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`📱 Frontend: http://localhost:${port}`);
  console.log(`🔌 API: http://localhost:${port}/api`);
  console.log(`❤️  Health check: http://localhost:${port}/health`);
});
