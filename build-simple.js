#!/usr/bin/env node

import { execSync } from "child_process";
import fs from "fs";

console.log("🚀 Simple build process...");

try {
  // Clean previous builds
  if (fs.existsSync("dist")) {
    fs.rmSync("dist", { recursive: true, force: true });
  }
  fs.mkdirSync("dist", { recursive: true });

  // Build client first
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
