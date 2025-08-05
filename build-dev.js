import { build } from 'vite';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Building for development...');

// Ensure dist directories exist
const distDir = './dist';
const distPublicDir = './dist/public';

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

if (!fs.existsSync(distPublicDir)) {
  fs.mkdirSync(distPublicDir, { recursive: true });
}

try {
  // Build client (frontend)
  console.log('📦 Building client...');
  await build({
    root: '.',
    build: {
      outDir: 'dist/spa',
      emptyOutDir: true,
      rollupOptions: {
        input: {
          main: './index.html'
        }
      }
    }
  });

  // Build server
  console.log('🔧 Building server...');
  await build({
    configFile: './vite.config.server.ts',
    build: {
      outDir: 'dist/server',
      emptyOutDir: true
    }
  });

  // Copy public files to dist
  console.log('📁 Copying public files...');
  if (fs.existsSync('./public')) {
    execSync('cp -r ./public/* ./dist/public/', { stdio: 'inherit' });
  }

  // Copy uploads if they exist
  if (fs.existsSync('./public/uploads')) {
    if (!fs.existsSync('./dist/public/uploads')) {
      fs.mkdirSync('./dist/public/uploads', { recursive: true });
    }
    execSync('cp -r ./public/uploads/* ./dist/public/uploads/', { stdio: 'inherit' });
  }

  console.log('✅ Development build completed successfully!');
  
  // Verify API endpoints
  const serverFiles = fs.readdirSync('./dist/server', { recursive: true });
  const hasProductsRoute = serverFiles.some(file => 
    typeof file === 'string' && file.includes('products') && file.endsWith('.js')
  );
  
  if (hasProductsRoute) {
    console.log('✅ API routes built successfully');
  } else {
    console.log('⚠️  Warning: API routes may not be built correctly');
  }

} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}
