#!/usr/bin/env node

// Persistent server that resists termination for EasyPanel debugging
import express from "express";

const port = process.env.PORT || 3000;
const app = express();

console.log("🔒 Persistent server starting (ignoring SIGTERM)...");

// Basic routes
app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    pid: process.pid
  });
});

app.get("/", (req, res) => {
  res.send(`
    <html>
      <head><title>EasyPanel Persistent Test</title></head>
      <body style="font-family: Arial; text-align: center; padding: 50px; background: #1a1a1a; color: white;">
        <h1>🚀 EASYPANEL SERVIDOR FUNCIONANDO!</h1>
        <p><strong>Port:</strong> ${port}</p>
        <p><strong>Status:</strong> Persistent & Healthy</p>
        <p><strong>Uptime:</strong> ${Math.floor(process.uptime())} seconds</p>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        <p><strong>PID:</strong> ${process.pid}</p>
        <div style="margin: 20px;">
          <a href="/health" style="color: #4CAF50;">Health Check JSON</a>
        </div>
        <p style="color: #4CAF50; font-weight: bold;">✅ SISTEMA FUNCIONANDO NO EASYPANEL!</p>
      </body>
    </html>
  `);
});

app.get("/status", (req, res) => {
  res.json({
    server: "persistent",
    platform: "easypanel",
    status: "running",
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    pid: process.pid,
    timestamp: new Date().toISOString()
  });
});

// Override signal handlers to prevent termination
process.on('SIGTERM', () => {
  console.log('🛡️  SIGTERM received but ignored (staying alive)');
});

process.on('SIGINT', () => {
  console.log('🛡️  SIGINT received but ignored (staying alive)');
});

process.on('SIGHUP', () => {
  console.log('🛡️  SIGHUP received but ignored (staying alive)');
});

// Start server
app.listen(port, "0.0.0.0", () => {
  console.log(`✅ Persistent server running on http://0.0.0.0:${port}`);
  console.log(`🔒 Signal handlers overridden - will resist termination`);
  console.log(`🎯 Test at: https://ide-b2btropical.jzo3qo.easypanel.host/`);
});

// Keep alive loop
setInterval(() => {
  console.log(`💗 Server alive - uptime: ${Math.floor(process.uptime())}s`);
}, 30000);
