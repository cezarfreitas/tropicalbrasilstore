#!/bin/bash

echo "🐳 Docker Deploy Desenvolvimento - Porta 80"
echo "============================================"

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script no diretório raiz do projeto"
    exit 1
fi

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Erro: Docker não está rodando"
    exit 1
fi

echo "1️⃣ Parando containers existentes..."
docker stop chinelos-dev-port80 2>/dev/null || true
docker rm chinelos-dev-port80 2>/dev/null || true

echo "2️⃣ Limpando imagens antigas..."
docker rmi chinelos-dev-port80 2>/dev/null || true

echo "3️⃣ Construindo e iniciando container..."
docker-compose -f docker-compose.dev-port80.yml up --build -d

if [ $? -ne 0 ]; then
    echo "❌ Erro ao iniciar container"
    exit 1
fi

echo "4️⃣ Aguardando container iniciar..."
sleep 15

echo "5️⃣ Verificando se está funcionando..."
for i in {1..10}; do
    if curl -f http://localhost/health >/dev/null 2>&1; then
        echo "✅ Aplicação está funcionando!"
        echo ""
        echo "🎉 Deploy de desenvolvimento concluído!"
        echo "📍 URL: http://localhost"
        echo "🔍 Logs: docker logs chinelos-dev-port80"
        echo "🛑 Parar: docker-compose -f docker-compose.dev-port80.yml down"
        exit 0
    fi
    echo "Tentativa $i/10 - Aguardando aplicação..."
    sleep 3
done

echo "❌ Aplicação não respondeu ao health check"
echo "📋 Logs do container:"
docker logs chinelos-dev-port80

exit 1
