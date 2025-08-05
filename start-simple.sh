#!/bin/bash

echo "⚡ Deploy Super Simples - Chinelos Store"
echo "======================================="

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script no diretório raiz do projeto"
    exit 1
fi

echo "1️⃣ Build da aplicação..."
npm run build

echo "2️⃣ Iniciando servidor simples..."
echo "📍 URL: http://localhost:8080"
echo "⚡ Modo: Super simples (sempre funciona)"
echo "🛑 Para parar: Ctrl+C"
echo ""

export NODE_ENV=production
export PORT=8080

# Compilar servidor simples
npx tsc server/simple-server.ts --outDir dist/server --target es2022 --module esnext --moduleResolution node --esModuleInterop --allowSyntheticDefaultImports 2>/dev/null

# Iniciar servidor
if [ -f "dist/server/simple-server.js" ]; then
    node dist/server/simple-server.js
else
    # Fallback - executar TypeScript diretamente
    npx tsx server/simple-server.ts
fi
