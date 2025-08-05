#!/bin/bash

# Script de Deploy para Desenvolvimento
echo "🚀 Iniciando deploy de desenvolvimento..."

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script no diretório raiz do projeto"
    exit 1
fi

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Erro: Docker não está rodando"
    exit 1
fi

# Parar containers existentes de desenvolvimento
echo "🛑 Parando containers de desenvolvimento existentes..."
docker-compose -f docker-compose.dev.yml down

# Limpar imagens antigas de desenvolvimento
echo "🧹 Limpando imagens antigas..."
docker image prune -f
docker rmi chinelos-store-dev_chinelos-dev 2>/dev/null || true

# Build da aplicação
echo "📦 Fazendo build da aplicação..."
npm run build:dev || {
    echo "❌ Erro no build da aplicação"
    exit 1
}

# Build e start dos containers
echo "🐳 Construindo e iniciando containers..."
docker-compose -f docker-compose.dev.yml up --build -d

# Aguardar containers iniciarem
echo "⏳ Aguardando containers iniciarem..."
sleep 10

# Verificar health check
echo "🏥 Verificando health check..."
for i in {1..10}; do
    if curl -f http://localhost:8080/health > /dev/null 2>&1; then
        echo "✅ Aplicação está rodando!"
        echo ""
        echo "🎉 Deploy de desenvolvimento concluído com sucesso!"
        echo "📍 URL: http://localhost:8080"
        echo "🔍 Logs: docker-compose -f docker-compose.dev.yml logs -f"
        echo "🛑 Parar: docker-compose -f docker-compose.dev.yml down"
        exit 0
    fi
    echo "Tentativa $i/10 - Aguardando aplicação..."
    sleep 5
done

echo "❌ Aplicação não respondeu ao health check"
echo "📋 Logs dos containers:"
docker-compose -f docker-compose.dev.yml logs

exit 1
