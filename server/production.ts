import express from "express";
import path from "path";
import { createServer } from "./index.js";
import fs from "fs";
import compression from "compression";
import helmet from "helmet";

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

    // Log each asset file size
    fs.readdirSync(assetsPath).forEach((file) => {
      const filePath = path.join(assetsPath, file);
      const stats = fs.statSync(filePath);
      console.log(`📄 ${file}: ${stats.size} bytes`);
    });
  }
} else {
  console.error(`❌ Static path does not exist: ${staticPath}`);
}

// Security and performance middleware
app.use(compression({ threshold: 0 })); // Compress all responses

// Security headers with helmet (production-ready)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      fontSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const isAsset = req.path.startsWith("/assets/") || req.path.startsWith("/uploads/");
    
    if (!isAsset || res.statusCode >= 400) {
      console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    }
  });
  
  next();
});

// CORS for API routes
app.use('/api', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Static file serving with optimized headers
app.use(express.static(staticPath, {
  etag: true,
  lastModified: true,
  maxAge: '1y', // 1 year cache for assets
  setHeaders: (res, filePath) => {
    const ext = path.extname(filePath);
    
    // JavaScript files
    if (ext === '.js') {
      res.set({
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*'
      });
    }
    
    // CSS files
    else if (ext === '.css') {
      res.set({
        'Content-Type': 'text/css; charset=utf-8',
        'Cache-Control': 'public, max-age=31536000, immutable'
      });
    }
    
    // HTML files (no cache)
    else if (ext === '.html') {
      res.set({
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
    }
    
    // Images
    else if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'].includes(ext)) {
      res.set({
        'Cache-Control': 'public, max-age=31536000, immutable'
      });
    }
  }
}));

// Serve uploads directory
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads'), {
  maxAge: '7d', // 7 days cache for uploads
  etag: true
}));

// Serve public files (manifest, etc)
app.use(express.static(path.join(process.cwd(), 'public'), {
  maxAge: '1d' // 1 day cache for public files
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version
  });
});

// Debug endpoint for production diagnostics
app.get('/debug/status', (req, res) => {
  const indexPath = path.join(staticPath, 'index.html');
  const assetsPath = path.join(staticPath, 'assets');

  const debugInfo = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    port: process.env.PORT,
    staticPath,
    staticExists: fs.existsSync(staticPath),
    indexExists: fs.existsSync(indexPath),
    assetsExists: fs.existsSync(assetsPath),
    staticFiles: fs.existsSync(staticPath) ? fs.readdirSync(staticPath) : [],
    assetFiles: fs.existsSync(assetsPath) ? fs.readdirSync(assetsPath) : [],
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    headers: {
      userAgent: req.get('User-Agent'),
      acceptEncoding: req.get('Accept-Encoding'),
      host: req.get('Host')
    }
  };

  res.json(debugInfo);
});

// API ping endpoint
app.get('/api/ping', (req, res) => {
  res.json({ 
    message: 'pong', 
    timestamp: new Date().toISOString(),
    server: 'production'
  });
});

// SPA fallback - serve index.html for all non-API/non-upload routes
app.get('*', (req, res) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found', path: req.path });
  }

  // Skip upload routes
  if (req.path.startsWith('/uploads/')) {
    return res.status(404).json({ error: 'Upload not found', path: req.path });
  }

  // Skip health and debug routes
  if (['/health', '/debug/status'].includes(req.path)) {
    return res.status(404).json({ error: 'Route not found', path: req.path });
  }

  // Serve index.html for SPA routing
  const indexPath = path.join(staticPath, 'index.html');

  if (!fs.existsSync(indexPath)) {
    console.error(`❌ index.html not found at: ${indexPath}`);
    return res.status(500).json({ 
      error: 'Application not properly built', 
      missing: 'index.html' 
    });
  }

  res.set({
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });

  console.log(`📄 Serving SPA route: ${req.path}`);
  res.sendFile(indexPath);
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Production server error:', error);
  
  if (res.headersSent) {
    return next(error);
  }
  
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

const PORT = Number(process.env.PORT) || 80;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Production server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`🗂️ Serving static from: ${staticPath}`);
  console.log(`📊 Memory usage: ${JSON.stringify(process.memoryUsage(), null, 2)}`);
  console.log(`⚡ Node.js version: ${process.version}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 Debug status: http://localhost:${PORT}/debug/status`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});
