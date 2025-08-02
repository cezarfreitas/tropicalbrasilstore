#!/usr/bin/env node

// Check if all required dependencies are available
console.log("🔍 Checking dependencies...");

const requiredDeps = [
  "express",
  "mysql2",
  "cors",
  "jsonwebtoken",
  "bcryptjs",
  "multer",
];

let allGood = true;

for (const dep of requiredDeps) {
  try {
    require(dep);
    console.log(`✅ ${dep}: OK`);
  } catch (error) {
    console.error(`❌ ${dep}: MISSING`);
    allGood = false;
  }
}

// Check if dist files exist
const fs = require("fs");
const path = require("path");

const requiredFiles = ["dist/server/production.js", "dist/spa/index.html"];

for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}: EXISTS`);
  } else {
    console.error(`❌ ${file}: MISSING`);
    allGood = false;
  }
}

// Environment variables check
const requiredEnvs = ["NODE_ENV"];
const optionalEnvs = ["DATABASE_URL", "MYSQL_HOST", "DB_HOST", "PORT"];

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
