#!/bin/bash

echo "🚀 Migrando para estrutura frontend/backend separada..."

# Create directories if they don't exist
mkdir -p frontend/src
mkdir -p frontend/public
mkdir -p backend/src
mkdir -p backend/public

echo "📁 Criando diretórios..."

# Copy frontend files
echo "📱 Copiando arquivos do frontend..."
cp -r client/* frontend/src/ 2>/dev/null || echo "Diretório client não encontrado"
cp -r public/* frontend/public/ 2>/dev/null || echo "Diretório public não encontrado"

# Copy backend files
echo "🔧 Copiando arquivos do backend..."
cp -r server/* backend/src/ 2>/dev/null || echo "Diretório server não encontrado"
cp -r shared backend/src/ 2>/dev/null || echo "Diretório shared não encontrado"

# Copy uploads to backend
mkdir -p backend/public/uploads
cp -r public/uploads/* backend/public/uploads/ 2>/dev/null || echo "Diretório uploads não encontrado"

echo "⚡ Instalando dependências do frontend..."
cd frontend && npm install

echo "⚡ Instalando dependências do backend..."
cd ../backend && npm install

echo "✅ Migração concluída!"
echo ""
echo "📋 Próximos passos:"
echo "1. Revise os arquivos copiados em frontend/src e backend/src"
echo "2. Ajuste os imports nos arquivos do frontend (altere @ paths)"
echo "3. Configure as variáveis de ambiente:"
echo "   - Frontend: VITE_API_URL=http://localhost:3001"
echo "   - Backend: FRONTEND_URL=http://localhost:3000"
echo "4. Execute:"
echo "   - Frontend: cd frontend && npm run dev"
echo "   - Backend: cd backend && npm run dev"
echo ""
echo "🔗 URLs:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:3001"
echo "   - Backend Health: http://localhost:3001/health"
