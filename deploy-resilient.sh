#!/bin/bash

echo "🔧 Deploy Resiliente - Chinelos Store"
echo "====================================="

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

echo "2️⃣ Compilando servidor resiliente..."
npx tsc server/production-resilient.ts --outDir dist/server --target es2022 --module esnext --moduleResolution node --esModuleInterop --allowSyntheticDefaultImports
if [ $? -ne 0 ]; then
    echo "⚠️  Usando arquivo original..."
    cp server/production-resilient.ts dist/server/production-resilient.js
fi

echo "3️⃣ Configurando variáveis de ambiente..."
export NODE_ENV=production
export PORT=8080
export DATABASE_URL="mysql://tropical:805ce7692e5b4d6ced5f@5.161.52.206:3232/tropical"
export JWT_SECRET="tropical-brasil-secret-key-2025"
export CORS_ORIGIN="http://localhost:8080"

echo "4️⃣ Iniciando servidor resiliente..."
echo "📍 URL: http://localhost:8080"
echo "🔄 Modo: Resiliente (funciona mesmo sem banco)"
echo "🛑 Para parar: Ctrl+C"
echo ""

# Tentar com o servidor resiliente primeiro
if [ -f "dist/server/production-resilient.js" ]; then
    echo "🚀 Iniciando servidor resiliente..."
    node dist/server/production-resilient.js
else
    echo "🚀 Iniciando servidor padrão..."
    node dist/server/production.js
fi
