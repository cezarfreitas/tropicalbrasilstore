#!/bin/bash

# Script de Deploy para Produção
set -e

# Configurações
REGISTRY=${DOCKER_REGISTRY:-""}
IMAGE_NAME="chinelos-api"
REMOTE_HOST=${REMOTE_HOST:-""}
REMOTE_USER=${REMOTE_USER:-"root"}
APP_PATH=${APP_PATH:-"/opt/chinelos-store"}

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"; }
warn() { echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠️${NC} $1"; }
error() { echo -e "${RED}[$(date +'%H:%M:%S')] ❌${NC} $1"; }

echo "🚀 Deploy para Produção - API produto/variantes"
echo "=============================================="

# 1. Verificar configurações
log "Verificando configurações..."

if [ -z "$REMOTE_HOST" ]; then
    error "REMOTE_HOST não configurado. Use: export REMOTE_HOST=seu-servidor.com"
    exit 1
fi

if [ -z "$REGISTRY" ]; then
    warn "REGISTRY não configurado. Usando registry local."
fi

# 2. Build da imagem
log "Executando build..."
if [ -f "build-production.sh" ]; then
    chmod +x build-production.sh
    ./build-production.sh
else
    error "Script build-production.sh não encontrado!"
    exit 1
fi

# 3. Tag para registry (se configurado)
if [ -n "$REGISTRY" ]; then
    log "Fazendo tag para registry..."
    REMOTE_TAG="$REGISTRY/$IMAGE_NAME:latest"
    docker tag "$IMAGE_NAME:latest" "$REMOTE_TAG"
    
    log "Fazendo push para registry..."
    docker push "$REMOTE_TAG"
else
    log "Salvando imagem para transfer..."
    docker save "$IMAGE_NAME:latest" > chinelos-api.tar
fi

# 4. Deploy no servidor remoto
log "Conectando ao servidor $REMOTE_HOST..."

if [ -n "$REGISTRY" ]; then
    # Deploy com registry
    ssh $REMOTE_USER@$REMOTE_HOST << EOF
        set -e
        cd $APP_PATH || (echo "Criando diretório $APP_PATH..." && mkdir -p $APP_PATH && cd $APP_PATH)
        
        echo "📥 Baixando nova imagem..."
        docker pull $REMOTE_TAG
        docker tag $REMOTE_TAG $IMAGE_NAME:latest
        
        echo "🔄 Parando serviços antigos..."
        docker-compose -f docker-compose.prod.yml down || true
        
        echo "🚀 Iniciando novos serviços..."
        docker-compose -f docker-compose.prod.yml up -d
        
        echo "⏳ Aguardando serviços..."
        sleep 30
        
        echo "🏥 Verificando health check..."
        if curl -f http://localhost:80/health; then
            echo "✅ Deploy realizado com sucesso!"
        else
            echo "❌ Health check falhou"
            docker-compose -f docker-compose.prod.yml logs
            exit 1
        fi
EOF
else
    # Deploy transferindo arquivo
    log "Transferindo imagem Docker..."
    scp chinelos-api.tar docker-compose.prod.yml $REMOTE_USER@$REMOTE_HOST:$APP_PATH/
    
    ssh $REMOTE_USER@$REMOTE_HOST << EOF
        set -e
        cd $APP_PATH
        
        echo "📥 Carregando nova imagem..."
        docker load < chinelos-api.tar
        
        echo "🔄 Parando serviços antigos..."
        docker-compose -f docker-compose.prod.yml down || true
        
        echo "🚀 Iniciando novos serviços..."
        docker-compose -f docker-compose.prod.yml up -d
        
        echo "⏳ Aguardando serviços..."
        sleep 30
        
        echo "🏥 Verificando health check..."
        if curl -f http://localhost:80/health; then
            echo "✅ Deploy realizado com sucesso!"
        else
            echo "❌ Health check falhou"
            docker-compose -f docker-compose.prod.yml logs
            exit 1
        fi
        
        echo "🧹 Limpando arquivo temporário..."
        rm -f chinelos-api.tar
EOF
    
    # Limpar arquivo local
    rm -f chinelos-api.tar
fi

# 5. Testar API
log "Testando API produto/variantes..."
sleep 5

TEST_URL="http://$REMOTE_HOST/api/products/bulk"
if curl -f "$TEST_URL" > /dev/null 2>&1; then
    log "✅ API está respondendo"
else
    warn "⚠️ API pode não estar acessível externamente"
fi

echo ""
echo "🎉 Deploy concluído!"
echo "===================="
echo "🌐 URL: http://$REMOTE_HOST"
echo "🔗 API: http://$REMOTE_HOST/api/products/bulk"
echo "🏥 Health: http://$REMOTE_HOST/health"
echo ""
echo "📋 Comandos úteis:"
echo "Ver logs: ssh $REMOTE_USER@$REMOTE_HOST 'cd $APP_PATH && docker-compose -f docker-compose.prod.yml logs -f'"
echo "Restart: ssh $REMOTE_USER@$REMOTE_HOST 'cd $APP_PATH && docker-compose -f docker-compose.prod.yml restart'"
echo "Status: ssh $REMOTE_USER@$REMOTE_HOST 'cd $APP_PATH && docker-compose -f docker-compose.prod.yml ps'"
