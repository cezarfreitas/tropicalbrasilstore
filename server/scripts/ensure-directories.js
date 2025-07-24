const fs = require('fs');
const path = require('path');

function ensureDirectoryExists(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`✅ Created directory: ${dirPath}`);
    } else {
      console.log(`ℹ️ Directory already exists: ${dirPath}`);
    }
  } catch (error) {
    console.error(`❌ Failed to create directory ${dirPath}:`, error);
  }
}

// Ensure required directories exist
const baseDir = process.cwd();
const requiredDirs = [
  path.join(baseDir, 'public'),
  path.join(baseDir, 'public', 'uploads'),
  path.join(baseDir, 'public', 'uploads', 'logos'),
];

console.log('🔧 Ensuring required directories exist...');
requiredDirs.forEach(ensureDirectoryExists);
console.log('✅ Directory check completed');
