#!/bin/bash

echo "🧪 Testando build do Dockerfile..."

# Build da imagem
docker build -t chinelos-test:latest . --no-cache

if [ $? -eq 0 ]; then
    echo "✅ Dockerfile build bem-sucedido!"
    echo "🧹 Limpando imagem de teste..."
    docker rmi chinelos-test:latest
else
    echo "❌ Dockerfile build falhou!"
    exit 1
fi
