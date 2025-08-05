# Dockerfile Extremamente Simples
FROM node:18-alpine

WORKDIR /app

# Instalar dependências do sistema
RUN apk add --no-cache curl

# Copiar e instalar dependências
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copiar código fonte
COPY . .

# Build
RUN npm run build

# Configurações
ENV NODE_ENV=production
ENV PORT=80

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD curl -f http://localhost:80/api/ping || exit 1

# Start
CMD ["node", "dist/server/production.js"]
