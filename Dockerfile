# Dockerfile para EasyPanel
FROM node:22-alpine

WORKDIR /app

# Instalar curl para health checks
RUN apk add --no-cache curl

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm install --legacy-peer-deps

# Copiar código fonte
COPY . .

# Criar diretórios de upload
RUN mkdir -p public/uploads/logos public/uploads/products

# Build da aplicação
RUN npm run build

# Porta 80 para EasyPanel
ENV PORT=80
ENV NODE_ENV=production

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:80/health || exit 1

# Iniciar aplicação
CMD ["npm", "start"]
