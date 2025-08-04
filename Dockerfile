# Dockerfile para Produção - Versão com API produto/variantes
FROM node:22-alpine

WORKDIR /app

# Instalar ferramentas necessárias
RUN apk add --no-cache \
    curl \
    bash \
    git

# Copiar arquivos de configuração
COPY package*.json ./
COPY tsconfig.json ./

# Instalar dependências
RUN npm ci --legacy-peer-deps

# Copiar código fonte completo
COPY . .

# Criar diretórios necessários
RUN mkdir -p public/uploads/logos public/uploads/products

# Build completo do projeto
RUN npm run build

# Compilar TypeScript do servidor
RUN npx tsc -p server/tsconfig.json

# Copiar uploads para dist se existir
RUN if [ -d "public/uploads" ]; then \
      mkdir -p dist/public && \
      cp -r public/uploads dist/public/; \
    fi

# Verificar se o build incluiu as mudanças da API
RUN echo "✅ Verificando build da API..." && \
    grep -q "produto.*variantes" dist/server/routes/products.js && \
    echo "✅ API produto/variantes incluída no build" || \
    echo "❌ ERRO: API produto/variantes não encontrada no build"

# Configurar ambiente
ENV PORT=80
ENV NODE_ENV=production

# Expor porta
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:80/health || exit 1

# Comando de inicialização
CMD ["node", "dist/server/index.js"]
