#!/bin/bash

echo "🚀 Deploy PM2 Desenvolvimento - Porta 80"
echo "========================================="

# Verificar se PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    echo "📦 Instalando PM2..."
    sudo npm install -g pm2
fi

# Criar diretório de logs
mkdir -p logs

echo "1️⃣ Build da aplicação..."
npm run build

echo "2️⃣ Parando instâncias existentes..."
sudo pm2 stop chinelos-dev 2>/dev/null || true
sudo pm2 delete chinelos-dev 2>/dev/null || true

echo "3️⃣ Iniciando aplicação com PM2..."
sudo pm2 start ecosystem.dev.config.js

echo "4️⃣ Salvando configuração PM2..."
sudo pm2 save
sudo pm2 startup

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
