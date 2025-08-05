#!/bin/bash

echo "🚀 Deploy Local - Chinelos Store"
echo "================================="

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

echo "2️⃣ Parando containers existentes..."
docker stop chinelos-store 2>/dev/null || true
docker rm chinelos-store 2>/dev/null || true

echo "3️⃣ Construindo imagem Docker..."
docker build -t chinelos-store .
if [ $? -ne 0 ]; then
    echo "❌ Erro ao construir imagem Docker"
    exit 1
fi

echo "4️⃣ Iniciando container..."
docker run -d \
  --name chinelos-store \
  --restart unless-stopped \
  -p 80:80 \
  -e NODE_ENV=production \
  -e PORT=80 \
  -e DATABASE_URL="mysql://tropical:805ce7692e5b4d6ced5f@5.161.52.206:3232/tropical" \
  -e JWT_SECRET="tropical-brasil-secret-key-2025" \
  -e CORS_ORIGIN="http://localhost" \
  -v "$(pwd)/public/uploads:/app/public/uploads" \
  chinelos-store

if [ $? -ne 0 ]; then
    echo "❌ Erro ao iniciar container"
    exit 1
fi

echo "5️⃣ Aguardando aplicação iniciar..."
sleep 10

echo "6️⃣ Testando aplicação..."
for i in {1..5}; do
    if curl -f http://localhost/health >/dev/null 2>&1; then
        echo "✅ Aplicação está funcionando!"
        echo ""
        echo "🎉 Deploy concluído com sucesso!"
        echo "📍 URL: http://localhost"
        echo "🔍 Logs: docker logs chinelos-store"
        echo "🛑 Parar: docker stop chinelos-store"
        exit 0
    fi
    echo "Tentativa $i/5 - Aguardando..."
    sleep 5
done

echo "❌ Aplicação não respondeu"
echo "📋 Logs do container:"
docker logs chinelos-store
exit 1
