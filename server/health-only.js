#!/usr/bin/env node

// Super minimal server just for health checks
import express from "express";

const port = process.env.PORT || 3000;
const app = express();

console.log("🏥 Health-only server starting...");

// Immediate health check
app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

app.get("/", (req, res) => {
  res.send(`
    <html>
      <head><title>EasyPanel Health Check</title></head>
      <body style="font-family: Arial; text-align: center; padding: 50px;">
        <h1>🎉 EasyPanel Server Working!</h1>
        <p>Port: ${port}</p>
        <p>Status: Healthy</p>
        <p>Time: ${new Date().toISOString()}</p>
        <a href="/health">Health Check JSON</a>
      </body>
    </html>
  `);
});

// Start immediately without complex initialization
app.listen(port, "0.0.0.0", () => {
  console.log(`✅ Health server ready on port ${port}`);
});
