FROM node:18-alpine

WORKDIR /app

# Instalar dependências do sistema
RUN apk add --no-cache curl bash

# Copiar arquivos de configuração
COPY package*.json ./
COPY tsconfig.json ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY vite.config.ts ./
COPY vite.config.server.ts ./
COPY build.js ./

# Instalar todas as dependências
RUN npm ci

# Copiar código fonte
COPY client/ ./client/
COPY server/ ./server/
COPY shared/ ./shared/
COPY public/ ./public/
COPY components.json ./
COPY index.html ./

# Criar diretórios necessários
RUN mkdir -p public/uploads/logos public/uploads/products

# Build da aplicação
RUN npm run build

# Verificar se arquivos principais foram criados
RUN test -f dist/server/production.js || (echo "❌ production.js não encontrado" && exit 1)
RUN test -f dist/spa/index.html || (echo "❌ index.html não encontrado" && exit 1)

# Remover node_modules e reinstalar só produção
RUN rm -rf node_modules
RUN npm ci --only=production

# Configurar ambiente
ENV NODE_ENV=production
ENV PORT=80

# Expor porta
EXPOSE 80

# Health check simples
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:80/api/ping || exit 1

# Comando de inicialização
CMD ["node", "dist/server/production.js"]
