#!/bin/bash

echo "🔧 CRIANDO ARQUIVOS FALTANTES - Chinelos Store"
echo "==============================================="

# Função para criar arquivo se não existir
create_if_missing() {
    local file="$1"
    local content="$2"
    
    if [ ! -f "$file" ]; then
        echo "📝 Criando: $file"
        echo "$content" > "$file"
        echo "✅ $file criado"
    else
        echo "✅ $file já existe"
    fi
}

echo ""
echo "1️⃣ VERIFICANDO E CRIANDO ARQUIVOS ESSENCIAIS:"
echo "----------------------------------------------"

# .env básico se não existir
if [ ! -f ".env" ]; then
    echo "📝 Criando .env básico..."
    cat > .env << 'EOF'
NODE_ENV=development
PORT=8080
DATABASE_URL=mysql://tropical:805ce7692e5b4d6ced5f@5.161.52.206:3232/tropical
JWT_SECRET=tropical-brasil-secret-key-2025
CORS_ORIGIN=http://localhost:8080
EOF
    echo "✅ .env criado"
fi

# Script de start simples
if [ ! -f "start-now.sh" ]; then
    echo "📝 Criando start-now.sh..."
    cat > start-now.sh << 'EOF'
#!/bin/bash
echo "🚀 Iniciando Chinelos Store..."

# Build se necessário
if [ ! -f "dist/server/production.js" ]; then
    echo "📦 Fazendo build..."
    npm run build
fi

# Configurar ambiente
export NODE_ENV=development
export PORT=8080

# Iniciar
echo "📍 URL: http://localhost:8080"
node dist/server/production.js
EOF
    chmod +x start-now.sh
    echo "✅ start-now.sh criado e executável"
fi

# Dockerfile básico se não existir  
if [ ! -f "Dockerfile.basic" ]; then
    echo "📝 Criando Dockerfile.basic..."
    cat > Dockerfile.basic << 'EOF'
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build
ENV NODE_ENV=production
ENV PORT=80
EXPOSE 80
CMD ["node", "dist/server/production.js"]
EOF
    echo "✅ Dockerfile.basic criado"
fi

# docker-compose básico se não existir
if [ ! -f "docker-compose.basic.yml" ]; then
    echo "📝 Criando docker-compose.basic.yml..."
    cat > docker-compose.basic.yml << 'EOF'
version: "3.8"
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.basic
    ports:
      - "8080:80"
    environment:
      - NODE_ENV=production
      - PORT=80
      - DATABASE_URL=mysql://tropical:805ce7692e5b4d6ced5f@5.161.52.206:3232/tropical
EOF
    echo "✅ docker-compose.basic.yml criado"
fi

echo ""
echo "2️⃣ VERIFICANDO DEPENDÊNCIAS:"
echo "-----------------------------"

if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
    echo "✅ Dependências instaladas"
else
    echo "✅ node_modules já existe"
fi

echo ""
echo "3️⃣ VERIFICANDO BUILD:"
echo "---------------------"

if [ ! -f "dist/server/production.js" ] || [ ! -f "dist/spa/index.html" ]; then
    echo "🏗️ Fazendo build completo..."
    npm run build
    
    if [ $? -eq 0 ]; then
        echo "✅ Build concluído com sucesso"
    else
        echo "❌ Erro no build"
        exit 1
    fi
else
    echo "✅ Build já existe"
fi

echo ""
echo "4️⃣ VERIFICAÇÃO FINAL:"
echo "---------------------"

# Verificar arquivos críticos
CRITICAL_FILES=(
    "dist/server/production.js"
    "dist/spa/index.html"
    "package.json"
    "start-now.sh"
)

ALL_OK=true
for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file FALTANDO"
        ALL_OK=false
    fi
done

echo ""
if [ "$ALL_OK" = true ]; then
    echo "🎉 SUCESSO! Todos os arquivos essenciais estão prontos!"
    echo ""
    echo "🚀 PARA INICIAR A APLICAÇÃO:"
    echo "----------------------------"
    echo "1. Opção Simples:"
    echo "   ./start-now.sh"
    echo ""
    echo "2. Opção Docker:"
    echo "   docker-compose -f docker-compose.basic.yml up"
    echo ""
    echo "3. Opção NPM:"
    echo "   npm start"
else
    echo "⚠️ ATENÇÃO: Alguns arquivos ainda estão faltando"
    echo "💡 Execute novamente este script ou contate o suporte"
fi

echo ""
echo "📍 URLs de acesso (quando iniciado):"
echo "   http://localhost:8080 (modo desenvolvimento)"
echo "   http://localhost (modo Docker)"
