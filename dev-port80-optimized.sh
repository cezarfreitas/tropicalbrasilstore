#!/bin/bash

echo "🚀 Deploy Desenvolvimento Otimizado - Porta 80"
echo "==============================================="

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script no diretório raiz do projeto"
    exit 1
fi

echo "1️⃣ Build rápido da aplicação..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Erro no build"
    exit 1
fi

echo "2️⃣ Configurando ambiente de desenvolvimento..."
export NODE_ENV=development
export PORT=80
export DATABASE_URL="mysql://tropical:805ce7692e5b4d6ced5f@5.161.52.206:3232/tropical"
export JWT_SECRET="tropical-brasil-secret-key-2025-dev"
export CORS_ORIGIN="http://localhost"
export DEBUG_MODE="true"
export LOG_LEVEL="debug"

echo "3️⃣ Verificando porta 80..."
if lsof -Pi :80 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Porta 80 está em uso. Parando processo..."
    sudo lsof -ti:80 | xargs sudo kill -9 2>/dev/null || true
    sleep 2
fi

echo "4️⃣ Iniciando servidor de desenvolvimento..."
echo ""
echo "📍 URL: http://localhost"
echo "🔧 Ambiente: Desenvolvimento"
echo "📊 Debug: Ativado"
echo "💾 Banco: Conectado"
echo "🛑 Parar: Ctrl+C"
echo ""

# Usar sudo para porta 80
sudo -E node dist/server/production.js
