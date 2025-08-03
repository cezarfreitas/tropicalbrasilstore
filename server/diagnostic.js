const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const port = process.env.PORT || 3000;

// Simple health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    port: port,
    environment: process.env.NODE_ENV || "development",
  });
});

// Diagnostic endpoint
app.get("/diagnostic", (req, res) => {
  const staticPath = path.join(__dirname, "../spa");
  const assetsPath = path.join(staticPath, "assets");

  const diagnostic = {
    server: "running",
    port: port,
    environment: process.env.NODE_ENV,
    paths: {
      staticPath: staticPath,
      assetsPath: assetsPath,
      staticExists: fs.existsSync(staticPath),
      assetsExists: fs.existsSync(assetsPath),
    },
  };

  if (fs.existsSync(assetsPath)) {
    diagnostic.assets = fs.readdirSync(assetsPath);
  }

  if (fs.existsSync(staticPath)) {
    diagnostic.staticFiles = fs.readdirSync(staticPath);
  }

  res.json(diagnostic);
});

// Test asset serving
app.use("/assets", express.static(path.join(__dirname, "../spa/assets")));

// Simple root response
app.get("/", (req, res) => {
  res.send(`
    <html>
      <head><title>Diagnostic Server</title></head>
      <body>
        <h1>🩺 Diagnostic Server Running</h1>
        <p>Port: ${port}</p>
        <p>Environment: ${process.env.NODE_ENV || "development"}</p>
        <p><a href="/health">Health Check</a></p>
        <p><a href="/diagnostic">Full Diagnostic</a></p>
      </body>
    </html>
  `);
});

app.listen(port, "0.0.0.0", () => {
  console.log(`🩺 Diagnostic server running on http://0.0.0.0:${port}`);
});
