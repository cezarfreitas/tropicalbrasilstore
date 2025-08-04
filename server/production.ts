import express from "express";
import path from "path";
import { createServer } from "./index.js";

const app = createServer();

// Production static file serving
const staticPath = path.join(process.cwd(), "dist", "spa");
console.log(`🗂️  Serving static files from: ${staticPath}`);

// Serve the built client files
app.use(express.static(staticPath));

// Serve static files for uploads
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "public", "uploads")),
);

// Catch-all handler for SPA routing
app.get("*", (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith("/api/") || req.path.startsWith("/uploads/")) {
    return res.status(404).json({ error: "Not Found" });
  }

  res.sendFile(path.join(staticPath, "index.html"));
});

const PORT = process.env.PORT || 80;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Production server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(
    `💾 Database: ${process.env.DATABASE_URL ? "Connected" : "No URL set"}`,
  );
});
