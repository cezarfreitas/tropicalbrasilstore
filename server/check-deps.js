#!/usr/bin/env node

// Check if all required dependencies are available
import fs from 'fs';
import path from 'path';

console.log("🔍 Checking dependencies...");

const requiredDeps = [
  'express',
  'mysql2',
  'cors',
  'jsonwebtoken',
  'bcryptjs',
  'multer'
];

let allGood = true;

// Check dependencies using dynamic imports
for (const dep of requiredDeps) {
  try {
    await import(dep);
    console.log(`✅ ${dep}: OK`);
  } catch (error) {
    console.error(`❌ ${dep}: MISSING - ${error.message}`);
    allGood = false;
  }
}

// Check if dist files exist
const requiredFiles = [
  'dist/server/production.js',
  'dist/spa/index.html'
];

for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}: EXISTS`);
  } else {
    console.error(`❌ ${file}: MISSING`);
    allGood = false;
  }
}

// Environment variables check
const requiredEnvs = ['NODE_ENV'];
const optionalEnvs = ['DATABASE_URL', 'MYSQL_HOST', 'DB_HOST', 'PORT'];

console.log("\n📋 Environment Variables:");
for (const env of requiredEnvs) {
  if (process.env[env]) {
    console.log(`✅ ${env}: ${process.env[env]}`);
  } else {
    console.log(`⚠️  ${env}: NOT SET`);
  }
}

for (const env of optionalEnvs) {
  if (process.env[env]) {
    console.log(`ℹ️  ${env}: SET`);
  } else {
    console.log(`ℹ️  ${env}: NOT SET`);
  }
}

if (allGood) {
  console.log("\n🎉 All dependencies and files are available!");
} else {
  console.log("\n❌ Some dependencies or files are missing!");
  process.exit(1);
}
