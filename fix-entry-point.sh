#!/bin/bash

echo "🔧 Corrigindo Entry Point - app.js"
echo "=================================="

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script no diretório raiz do projeto"
    exit 1
fi

echo "1️⃣ Verificando arquivos de entrada..."
if [ ! -f "dist/server/production.js" ]; then
    echo "⚠️  Arquivo production.js não encontrado. Fazendo build..."
    npm run build
fi

echo "2️⃣ Verificando se alguém está tentando executar app.js..."
if pgrep -f "app.js" > /dev/null; then
    echo "🛑 Parando processos que usam app.js..."
    pkill -f "app.js"
fi

echo "3️⃣ Verificando PM2..."
if command -v pm2 &> /dev/null; then
    echo "📋 Parando todas as instâncias PM2..."
    pm2 stop all 2>/dev/null || true
    pm2 delete all 2>/dev/null || true
fi

echo "4️⃣ Testando entrada correta..."
export NODE_ENV=development
export PORT=8080

echo "📍 Testando: node dist/server/production.js"
echo "🔍 Se funcionar, o problema foi resolvido"
echo "🛑 Parar com: Ctrl+C"
echo ""

node dist/server/production.js
