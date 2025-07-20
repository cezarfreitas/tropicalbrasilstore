#!/bin/bash

# Chinelos Store - Deploy Script for Easy Panel

echo "🚀 Iniciando deploy da Chinelos Store..."

# Verificar se docker e docker-compose estão instalados
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não encontrado. Instale o Docker primeiro."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não encontrado. Instale o Docker Compose primeiro."
    exit 1
fi

# Criar arquivo .env se não existir
if [ ! -f .env ]; then
    echo "📝 Criando arquivo .env..."
    cp .env.example .env
    echo "⚠️  Configure as variáveis de ambiente no arquivo .env"
fi

# Build e start dos containers
echo "🔨 Fazendo build da aplicação..."
docker-compose build --no-cache

echo "🚀 Iniciando containers..."
docker-compose up -d

# Verificar se os containers estão rodando
echo "🔍 Verificando status dos containers..."
docker-compose ps

echo "✅ Deploy concluído!"
echo ""
echo "📱 Aplicação disponível em: http://localhost:3000"
echo "🗄️  Banco de dados disponível em: localhost:3306"
echo ""
echo "📋 Para ver os logs:"
echo "   docker-compose logs -f app"
echo ""
echo "🛑 Para parar a aplicação:"
echo "   docker-compose down"
echo ""
echo "🔄 Para reiniciar:"
echo "   docker-compose restart"
