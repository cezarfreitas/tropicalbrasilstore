#!/usr/bin/env node

import { execSync } from "child_process";
import fs from "fs";

console.log("🚀 Client-only build for deploy...");

// Environment optimizations for deploy
const deployEnv = {
  ...process.env,
  NODE_ENV: "production",
  VITE_BUILD_FAST: "true",
  CI: "true",
  DISABLE_ESLINT_PLUGIN: "true",
  VITE_DISABLE_DEV_LOGS: "true",
};

try {
  // Clean previous builds quickly
  console.log("🧹 Cleaning spa build...");
  if (fs.existsSync("dist/spa")) {
    fs.rmSync("dist/spa", { recursive: true, force: true });
  }
  fs.mkdirSync("dist/spa", { recursive: true });

  // Only build client (frontend)
  console.log("🎨 Building client only...");
  execSync("npm run build:client", {
    stdio: "inherit",
    timeout: 90000, // 1.5 minutes
    env: deployEnv,
  });

  // Copy existing server build if it exists, otherwise build it
  if (!fs.existsSync("dist/server")) {
    console.log("🚀 Building server...");
    execSync("npm run build:server", {
      stdio: "inherit",
      timeout: 60000, // 1 minute
      env: deployEnv,
    });
  } else {
    console.log("✅ Server build already exists, skipping...");
  }

  console.log("✅ Client-only build completed!");
  process.exit(0);
  
} catch (error) {
  console.error("❌ Client-only build failed:", error.message);
  process.exit(1);
}
