#!/usr/bin/env node

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

console.log("🚀 Iniciando build de produção...");

try {
  // Limpar build anterior
  if (fs.existsSync("dist")) {
    console.log("🗑️ Limpando build anterior...");
    fs.rmSync("dist", { recursive: true, force: true });
  }

  // Criar diretório dist
  fs.mkdirSync("dist", { recursive: true });

  // Build do cliente (frontend)
  console.log("🎨 Buildando frontend...");
  execSync("npx vite build", { stdio: "inherit" });

  // Verificar se frontend foi buildado
  if (!fs.existsSync("dist/spa/index.html")) {
    throw new Error("❌ Frontend build falhou - index.html não encontrado");
  }
  console.log("✅ Frontend build concluído");

  // Build do servidor (backend)
  console.log("🚀 Buildando backend...");
  execSync("npx vite build --config vite.config.server.ts", { 
    stdio: "inherit",
    env: { ...process.env, NODE_ENV: "production" }
  });

  // Verificar se backend foi buildado
  if (!fs.existsSync("dist/server/production.js")) {
    throw new Error("❌ Backend build falhou - production.js não encontrado");
  }
  console.log("✅ Backend build concluído");

  // Verificar estrutura final
  console.log("📁 Verificando estrutura final...");
  
  const expectedFiles = [
    "dist/spa/index.html",
    "dist/server/production.js"
  ];

  expectedFiles.forEach(file => {
    if (!fs.existsSync(file)) {
      throw new Error(`❌ Arquivo obrigatório não encontrado: ${file}`);
    }
    const stats = fs.statSync(file);
    console.log(`✅ ${file} (${Math.round(stats.size / 1024)}KB)`);
  });

  // Verificar assets CSS e JS
  const assetsDir = "dist/spa/assets";
  if (fs.existsSync(assetsDir)) {
    const assets = fs.readdirSync(assetsDir);
    const jsFiles = assets.filter(f => f.endsWith('.js'));
    const cssFiles = assets.filter(f => f.endsWith('.css'));
    
    console.log(`📦 Assets encontrados: ${jsFiles.length} JS, ${cssFiles.length} CSS`);
  }

  console.log("🎉 Build de produção concluído com sucesso!");
  console.log("📋 Estrutura final:");
  console.log("   dist/spa/     - Frontend (HTML, CSS, JS)");
  console.log("   dist/server/  - Backend (Node.js)");

} catch (error) {
  console.error("❌ Erro no build:", error.message);
  process.exit(1);
}
