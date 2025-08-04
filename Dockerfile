# Dockerfile para EasyPanel - Modo Produção
FROM node:22-alpine

WORKDIR /app

# Instalar curl para health checks
RUN apk add --no-cache curl

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências com resolução de conflitos
RUN npm install --legacy-peer-deps

# Copiar código fonte
COPY . .

# Criar diretórios de upload
RUN mkdir -p public/uploads/logos public/uploads/products

# Build do projeto para produção
RUN npm run build

# Copiar pasta uploads para o build se existir
RUN if [ -d "public/uploads" ]; then \
      mkdir -p dist/public && \
      cp -r public/uploads dist/public/; \
    fi

# Porta 80 para EasyPanel
ENV PORT=80
ENV NODE_ENV=production
ENV DATABASE_URL=mysql://tropical:805ce7692e5b4d6ced5f@5.161.52.206:3232/tropical

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:80/health || exit 1

# Iniciar servidor de produção
CMD ["node", "dist/server/index.js"]
