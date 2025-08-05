# Dockerfile Simplificado para Produção
FROM node:20-alpine

WORKDIR /app

# Instalar dependências básicas
RUN apk add --no-cache curl

# Copiar package.json
COPY package*.json ./

# Instalar dependências (forçar resolução de conflitos)
RUN npm install --legacy-peer-deps --omit=dev

# Copiar código source
COPY . .

# Build da aplicação
RUN npm run build

# Configurações
ENV NODE_ENV=production
ENV PORT=80

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:80/api/ping || exit 1

# Executar
CMD ["node", "dist/server/production.js"]
