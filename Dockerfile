FROM node:18-alpine

WORKDIR /app

# Instalar dependências do sistema
RUN apk add --no-cache curl

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar todas as dependências (necessárias para build)
RUN npm ci

# Copiar código fonte
COPY . .

# Criar diretórios necessários
RUN mkdir -p public/uploads/logos public/uploads/products

# Build da aplicação
RUN npm run build

# Verificar se build foi criado
RUN ls -la dist/

# Configurar ambiente
ENV NODE_ENV=production
ENV PORT=80

# Expor porta
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:80/api/ping || exit 1

# Comando de inicialização
CMD ["node", "dist/server/production.js"]
