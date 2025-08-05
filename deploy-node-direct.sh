#!/bin/bash

echo "🚀 Deploy Local - Node.js Direto"
echo "================================"

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script no diretório raiz do projeto"
    exit 1
fi

echo "1️⃣ Fazendo build da aplicação..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Erro no build"
    exit 1
fi

echo "2️⃣ Verificando arquivos de build..."
if [ ! -f "dist/server/production.js" ]; then
    echo "❌ Arquivo production.js não encontrado"
    exit 1
fi

if [ ! -f "dist/spa/index.html" ]; then
    echo "❌ Arquivo index.html não encontrado"
    exit 1
fi

echo "3️⃣ Configurando variáveis de ambiente..."
export NODE_ENV=production
export PORT=8080
export DATABASE_URL="mysql://tropical:805ce7692e5b4d6ced5f@5.161.52.206:3232/tropical"
export JWT_SECRET="tropical-brasil-secret-key-2025"
export CORS_ORIGIN="http://localhost:8080"

echo "4️⃣ Iniciando aplicação..."
echo "📍 URL: http://localhost:8080"
echo "🛑 Para parar: Ctrl+C"
echo ""

node dist/server/production.js
