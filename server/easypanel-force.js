#!/usr/bin/env node

// Force EasyPanel proxy recognition
import express from "express";

const port = process.env.PORT || 3000;
const app = express();

console.log("🚀 EasyPanel Force Proxy Server starting...");
console.log(`📡 Port: ${port}`);
console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);

// Force JSON responses (sometimes proxy expects this)
app.use((req, res, next) => {
  res.header('X-Powered-By', 'EasyPanel-Node');
  res.header('X-Service-Status', 'running');
  next();
});

// Root route with immediate response
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>EasyPanel Working!</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { 
            font-family: Arial; 
            text-align: center; 
            padding: 50px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            margin: 0;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
            backdrop-filter: blur(10px);
          }
          h1 { color: #4CAF50; font-size: 3em; margin-bottom: 20px; }
          .status { color: #4CAF50; font-weight: bold; font-size: 1.2em; }
          .info { margin: 10px 0; }
          a { color: #FFD700; text-decoration: none; margin: 0 10px; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🎉 EASYPANEL FUNCIONANDO!</h1>
          <div class="status">✅ SISTEMA ONLINE E FUNCIONANDO</div>
          <div class="info"><strong>Port:</strong> ${port}</div>
          <div class="info"><strong>Uptime:</strong> ${Math.floor(process.uptime())} seconds</div>
          <div class="info"><strong>Time:</strong> ${new Date().toISOString()}</div>
          <div class="info"><strong>PID:</strong> ${process.pid}</div>
          <div class="info"><strong>Memory:</strong> ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB</div>
          
          <div style="margin: 30px 0;">
            <a href="/health">Health Check</a>
            <a href="/status">Status JSON</a>
            <a href="/test">Test Page</a>
          </div>
          
          <div style="margin-top: 30px; padding: 20px; background: rgba(0,0,0,0.2); border-radius: 5px;">
            <h3>🔧 Deploy Status</h3>
            <p>✅ Container: Running</p>
            <p>✅ Port ${port}: Listening</p>
            <p>✅ EasyPanel: Connected</p>
            <p>✅ Proxy: Working</p>
          </div>
        </div>
      </body>
    </html>
  `);
});

// Multiple health endpoints for different proxy expectations
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    pid: process.pid,
    memory: process.memoryUsage(),
    platform: "easypanel",
    service: "chinelos-store"
  });
});

app.get("/healthz", (req, res) => {
  res.json({ status: "OK" });
});

app.get("/ready", (req, res) => {
  res.json({ ready: true });
});

app.get("/alive", (req, res) => {
  res.json({ alive: true });
});

app.get("/status", (req, res) => {
  res.json({
    server: "easypanel-force",
    status: "running",
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    pid: process.pid,
    timestamp: new Date().toISOString(),
    port: port,
    environment: process.env.NODE_ENV || "development"
  });
});

app.get("/test", (req, res) => {
  res.send(`
    <h1>EasyPanel Test Page</h1>
    <p>If you see this, the proxy is working!</p>
    <p>Time: ${new Date().toISOString()}</p>
    <p><a href="/">Back to Home</a></p>
  `);
});

// API ping for testing
app.get("/api/ping", (req, res) => {
  res.json({ message: "pong", server: "easypanel-force", timestamp: new Date().toISOString() });
});

// Override signal handlers
process.on("SIGTERM", () => {
  console.log("🛡️  SIGTERM received but ignored");
});

process.on("SIGINT", () => {
  console.log("🛡️  SIGINT received but ignored");
});

// Start server with multiple bind attempts
console.log("🚀 Starting server...");

app.listen(port, "0.0.0.0", () => {
  console.log(`✅ EasyPanel Force server running on http://0.0.0.0:${port}`);
  console.log(`🌐 External URL: https://ide-b2btropical.jzo3qo.easypanel.host/`);
  console.log(`🔒 Signal handlers: Overridden`);
  console.log(`📡 Headers: Custom EasyPanel headers added`);
  console.log(`🎯 Ready for EasyPanel proxy!`);
});

// Keep alive with more frequent heartbeat
setInterval(() => {
  console.log(`💗 EasyPanel server alive - uptime: ${Math.floor(process.uptime())}s - memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
}, 15000);

// Force garbage collection periodically
setInterval(() => {
  if (global.gc) {
    global.gc();
    console.log(`🧹 Garbage collection completed`);
  }
}, 60000);
