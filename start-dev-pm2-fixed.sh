#!/bin/bash

echo "🚀 Deploy PM2 Desenvolvimento Corrigido - Porta 80"
echo "=================================================="

# Verificar se PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    echo "📦 Instalando PM2..."
    sudo npm install -g pm2
fi

# Criar diretório de logs
mkdir -p logs

echo "1️⃣ Build da aplicação..."
npm run build

# Verificar se o arquivo de entrada existe
if [ ! -f "dist/server/production.js" ]; then
    echo "❌ Erro: dist/server/production.js não encontrado"
    echo "💡 Execute: npm run build"
    exit 1
fi

echo "2️⃣ Parando instâncias existentes..."
sudo pm2 stop chinelos-dev 2>/dev/null || true
sudo pm2 delete chinelos-dev 2>/dev/null || true

echo "3️⃣ Testando arquivo antes de iniciar PM2..."
timeout 5 node dist/server/production.js &
sleep 2
pkill -f "production.js" 2>/dev/null || true

echo "4️⃣ Iniciando aplicação com PM2..."
sudo pm2 start dist/server/production.js \
    --name "chinelos-dev" \
    --env NODE_ENV=development \
    --env PORT=80 \
    --env DATABASE_URL="mysql://tropical:805ce7692e5b4d6ced5f@5.161.52.206:3232/tropical" \
    --env JWT_SECRET="tropical-brasil-secret-key-2025-dev" \
    --env CORS_ORIGIN="http://localhost" \
    --env DEBUG_MODE="true" \
    --log-date-format="YYYY-MM-DD HH:mm:ss Z" \
    --output="./logs/dev-out.log" \
    --error="./logs/dev-error.log" \
    --merge-logs

echo "5️⃣ Salvando configuração PM2..."
sudo pm2 save

echo ""
echo "✅ Aplicação iniciada com sucesso!"
echo "📍 URL: http://localhost"
echo "📊 Status: sudo pm2 status"
echo "📋 Logs: sudo pm2 logs chinelos-dev"
echo "🔄 Restart: sudo pm2 restart chinelos-dev"
echo "🛑 Parar: sudo pm2 stop chinelos-dev"
echo ""

# Mostrar status
sudo pm2 status
