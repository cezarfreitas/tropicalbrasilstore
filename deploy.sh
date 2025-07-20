#!/bin/bash

<<<<<<< HEAD
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
=======
# Deploy script for Nixpacks
echo "🚀 Starting deployment preparation..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Are you in the project root?"
    exit 1
fi

# Check if nixpacks.toml exists
if [ ! -f "nixpacks.toml" ]; then
    echo "❌ nixpacks.toml not found. Please create it first."
    exit 1
fi

echo "✅ Found required files"

# Run type checking
echo "🔍 Running type check..."
npm run typecheck
if [ $? -ne 0 ]; then
    echo "❌ Type check failed. Please fix type errors before deploying."
    exit 1
fi

echo "✅ Type check passed"

# Run tests if they exist
if npm list vitest > /dev/null 2>&1; then
    echo "🧪 Running tests..."
    npm test
    if [ $? -ne 0 ]; then
        echo "❌ Tests failed. Please fix failing tests before deploying."
        exit 1
    fi
    echo "✅ Tests passed"
fi

# Build the application locally to verify
echo "🔨 Building application..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix build errors before deploying."
    exit 1
fi

echo "✅ Build successful"

# Clean up build artifacts (they will be rebuilt during deployment)
rm -rf dist

echo "🎉 Deployment preparation complete!"
echo ""
echo "Your project is ready for Nixpacks deployment."
echo ""
echo "Environment variables needed for production:"
echo "  - DATABASE_URL or individual MYSQL_* variables"
echo "  - PORT (optional, defaults to 3000)"
echo "  - NODE_ENV=production"
echo ""
echo "Deploy with your preferred platform that supports Nixpacks:"
echo "  - Railway: railway up"
echo "  - Render: git push"
echo "  - Fly.io: fly deploy"
echo "  - Any Nixpacks-compatible platform"
>>>>>>> c72c1b6292519beaaf381a21765f20e08bcdca45
