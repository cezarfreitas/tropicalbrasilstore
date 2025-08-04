const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building for production deployment...');

try {
  // 1. Build client
  console.log('📦 Building client...');
  execSync('npm run build', { stdio: 'inherit' });

  // 2. Build server
  console.log('🔧 Building server...');
  execSync('npx tsc -p server/tsconfig.json', { stdio: 'inherit' });

  // 3. Copy uploads folder to dist
  const uploadsSource = path.join(process.cwd(), 'public', 'uploads');
  const uploadsTarget = path.join(process.cwd(), 'dist', 'public', 'uploads');
  
  if (fs.existsSync(uploadsSource)) {
    console.log('📂 Copying uploads folder...');
    
    // Create target directory
    const targetPublic = path.join(process.cwd(), 'dist', 'public');
    if (!fs.existsSync(targetPublic)) {
      fs.mkdirSync(targetPublic, { recursive: true });
    }

    // Copy uploads recursively
    execSync(`cp -r "${uploadsSource}" "${targetPublic}"`, { stdio: 'inherit' });
    console.log(`✅ Uploads copied to ${uploadsTarget}`);
  } else {
    console.log('⚠️ No uploads folder found');
  }

  // 4. Copy package files
  console.log('📄 Copying package files...');
  const filesToCopy = ['package.json', 'package-lock.json'];
  
  filesToCopy.forEach(file => {
    if (fs.existsSync(file)) {
      fs.copyFileSync(file, path.join('dist', file));
      console.log(`✅ Copied ${file}`);
    }
  });

  // 5. Create production server script
  console.log('🔧 Creating production server...');
  const productionScript = `#!/bin/bash
echo "🚀 Starting production server..."
cd /app/dist
npm ci --only=production
node server/production.js
`;

  fs.writeFileSync('dist/start.sh', productionScript);
  execSync('chmod +x dist/start.sh');
  console.log('✅ Production start script created');

  console.log('\n🎉 Build complete! Ready for deployment.');
  console.log('📁 Deploy contents: dist/');
  console.log('🖼️ Images included in build');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
