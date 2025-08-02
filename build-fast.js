#!/usr/bin/env node

import { execSync } from "child_process";
import fs from "fs";

console.log("⚡ Fast build process...");

try {
  // Clean previous builds
  if (fs.existsSync("dist")) {
    fs.rmSync("dist", { recursive: true, force: true });
  }
  fs.mkdirSync("dist", { recursive: true });

  // Build client with maximum speed
  console.log("🎨 Building client (fast)...");
  execSync("npm run build:client", {
    stdio: "inherit",
    timeout: 60000, // 1 minute for client
    env: {
      ...process.env,
      NODE_ENV: "production",
      VITE_BUILD_FAST: "true",
      CI: "true",
      DISABLE_ESLINT_PLUGIN: "true",
    },
  });

  // Build server with minimal processing
  console.log("🚀 Building server (fast)...");
  execSync("npm run build:server", {
    stdio: "inherit",
    timeout: 45000, // 45 seconds for server
    env: {
      ...process.env,
      NODE_ENV: "production",
      VITE_BUILD_FAST: "true",
      CI: "true",
    },
  });

  console.log("✅ Fast build completed!");
} catch (error) {
  console.error("❌ Fast build failed:", error.message);
  // Fallback to regular build with reasonable timeout
  console.log("🔄 Trying regular build...");
  try {
    execSync("node build.js", {
      stdio: "inherit",
      timeout: 180000, // 3 minutes for fallback
      env: {
        ...process.env,
        NODE_ENV: "production",
        CI: "true",
      },
    });
  } catch (fallbackError) {
    console.error("❌ Fallback build also failed:", fallbackError.message);
    process.exit(1);
  }
}
