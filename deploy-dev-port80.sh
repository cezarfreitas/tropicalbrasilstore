#!/bin/bash

echo "🚀 Deploy Desenvolvimento - Porta 80"
echo "====================================="

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script no diretório raiz do projeto"
    exit 1
fi

# Verificar se pode usar porta 80 (precisa de sudo)
if [ "$EUID" -ne 0 ]; then
    echo "🔐 Porta 80 requer privilégios de administrador"
    echo "💡 Execute: sudo ./deploy-dev-port80.sh"
    echo "💡 Ou use: ./start-simple.sh (porta 8080)"
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

echo "3️⃣ Configurando variáveis de ambiente para desenvolvimento..."
export NODE_ENV=development
export PORT=80
export DATABASE_URL="mysql://tropical:805ce7692e5b4d6ced5f@5.161.52.206:3232/tropical"
export JWT_SECRET="tropical-brasil-secret-key-2025-dev"
export CORS_ORIGIN="http://localhost"
export DEBUG_MODE="true"

echo "4️⃣ Parando processos existentes na porta 80..."
# Parar qualquer processo na porta 80
lsof -ti:80 | xargs kill -9 2>/dev/null || true
sleep 2

echo "5️⃣ Iniciando servidor de desenvolvimento na porta 80..."
echo "📍 URL: http://localhost"
echo "🔧 Modo: Desenvolvimento (porta 80)"
echo "🛑 Para parar: Ctrl+C"
echo ""

# Iniciar servidor
node dist/server/production.js
