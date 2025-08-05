# Dockerfile Ultra-Simplificado para Produção
FROM node:18-alpine

WORKDIR /app

# Instalar curl para health check
RUN apk add --no-cache curl

# Copiar package.json primeiro (para cache de dependências)
COPY package*.json ./

# Instalar dependências com flag para resolver conflitos
RUN npm ci --legacy-peer-deps

# Copiar todo o código source
COPY . .

# Build da aplicação
RUN npm run build

# Limpar cache npm para reduzir tamanho
RUN npm cache clean --force

# Configurações de ambiente
ENV NODE_ENV=production
ENV PORT=80

# Expor porta
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:80/api/ping || exit 1

# Comando de start
CMD ["node", "dist/server/production.js"]
