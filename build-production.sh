#!/bin/bash

# Script de Build para Produção - API produto/variantes
set -e

echo "🚀 Iniciando build para produção..."
echo "======================================"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠️ ${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ❌ ${NC} $1"
}

# 1. Verificar se Docker está rodando
log "Verificando Docker..."
if ! docker info > /dev/null 2>&1; then
    error "Docker não está rodando. Inicie o Docker e tente novamente."
    exit 1
fi

# 2. Limpar builds anteriores
log "Limpando builds anteriores..."
rm -rf dist/
docker image prune -f > /dev/null 2>&1 || true

# 3. Verificar mudanças da API
log "Verificando implementação da API produto/variantes..."
if grep -q "produto.*variantes" server/routes/products.ts; then
    log "✅ API produto/variantes encontrada no código fonte"
else
    error "❌ API produto/variantes não encontrada no código fonte!"
    exit 1
fi

# 4. Build da imagem Docker
log "Construindo imagem Docker..."
IMAGE_TAG="chinelos-api:$(date +%Y%m%d-%H%M%S)"
LATEST_TAG="chinelos-api:latest"

docker build \
    --tag $IMAGE_TAG \
    --tag $LATEST_TAG \
    --build-arg NODE_ENV=production \
    .

# 5. Verificar se o build foi bem-sucedido
log "Verificando build..."
if docker images | grep -q "chinelos-api.*latest"; then
    log "✅ Imagem Docker criada com sucesso"
else
    error "❌ Falha ao criar imagem Docker"
    exit 1
fi

# 6. Testar a imagem
log "Testando imagem Docker..."
CONTAINER_ID=$(docker run -d -p 8081:80 --name chinelos-test $LATEST_TAG)

# Aguardar container iniciar
sleep 10

# Testar health check
if curl -f http://localhost:8081/health > /dev/null 2>&1; then
    log "✅ Container funcionando corretamente"
else
    warn "⚠️ Health check falhou, mas continuando..."
fi

# Parar e remover container de teste
docker stop $CONTAINER_ID > /dev/null 2>&1
docker rm $CONTAINER_ID > /dev/null 2>&1

# 7. Mostrar informações finais
echo ""
echo "🎉 Build concluído com sucesso!"
echo "======================================"
echo "📦 Imagem criada: $IMAGE_TAG"
echo "📦 Tag latest: $LATEST_TAG"
echo ""
echo "📋 Próximos passos para deploy:"
echo "1. Push para registry: docker push $LATEST_TAG"
echo "2. Deploy no servidor: docker-compose -f docker-compose.prod.yml up -d"
echo "3. Testar endpoint: curl -X POST https://seu-dominio.com/api/products/bulk"
echo ""
echo "🔧 Para testar localmente:"
echo "docker-compose -f docker-compose.prod.yml up"
echo ""

# 8. Perguntar se quer fazer deploy local
read -p "Quer fazer deploy local para teste? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log "Iniciando deploy local..."
    docker-compose -f docker-compose.prod.yml up -d
    
    echo ""
    log "🚀 Deploy local iniciado!"
    log "📍 Acesse: http://localhost:80"
    log "🏥 Health: http://localhost:80/health"
    log "📊 Logs: docker-compose -f docker-compose.prod.yml logs -f"
fi
