#!/usr/bin/env node

import { execSync } from "child_process";
import fs from "fs";

console.log("🚀 Deploy build process for Easypanel...");

// Environment optimizations for deploy
const deployEnv = {
  ...process.env,
  NODE_ENV: "production",
  VITE_BUILD_FAST: "true",
  CI: "true",
  DISABLE_ESLINT_PLUGIN: "true",
  VITE_DISABLE_DEV_LOGS: "true",
  // Memory optimizations
  NODE_OPTIONS: "--max-old-space-size=2048",
};

try {
  // Clean previous builds aggressively
  console.log("🧹 Cleaning previous builds...");
  if (fs.existsSync("dist")) {
    fs.rmSync("dist", { recursive: true, force: true });
  }
  fs.mkdirSync("dist", { recursive: true });

  // Step 1: Build client with ultra-fast settings
  console.log("🎨 Building client (ultra-fast)...");
  try {
    execSync("npm run build:client", {
      stdio: "inherit",
      timeout: 40000, // 40 seconds
      env: deployEnv,
    });
    console.log("✅ Client build completed!");
  } catch (error) {
    console.log("⚠️ Client build timeout, retrying...");
    execSync("npm run build:client", {
      stdio: "inherit",
      timeout: 60000, // 1 minute retry
      env: deployEnv,
    });
  }

  // Step 2: Build server quickly
  console.log("🚀 Building server...");
  execSync("npm run build:server", {
    stdio: "inherit",
    timeout: 25000, // 25 seconds
    env: deployEnv,
  });

  console.log("✅ Deploy build completed successfully!");
  process.exit(0);
} catch (error) {
  console.error("❌ Deploy build failed:", error.message);

  // Last resort fallback
  console.log("🆘 Attempting emergency build...");
  try {
    execSync("vite build && vite build --config vite.config.server.ts", {
      stdio: "inherit",
      timeout: 80000, // 80 seconds last chance
      env: deployEnv,
    });
    console.log("✅ Emergency build completed!");
  } catch (finalError) {
    console.error("❌ All build attempts failed:", finalError.message);
    process.exit(1);
  }
}
