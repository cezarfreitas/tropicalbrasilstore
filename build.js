#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🏗️  Starting build process...");

try {
  // Clean previous builds
  if (fs.existsSync("dist")) {
    console.log("🗑️  Cleaning previous build...");
    fs.rmSync("dist", { recursive: true, force: true });
  }

  // Create dist directory
  fs.mkdirSync("dist", { recursive: true });

  // Build client
  console.log("🎨 Building client...");
  execSync("npm run build:client", { stdio: "inherit" });

  // Build server
  console.log("🚀 Building server...");
  execSync("npm run build:server", { stdio: "inherit" });

  console.log("✅ Build completed successfully!");
} catch (error) {
  console.error("❌ Build failed:", error.message);
  process.exit(1);
}
