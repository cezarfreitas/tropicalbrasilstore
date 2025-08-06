# Dockerfile Ultra-Simplificado para Produção
FROM node:18-alpine

WORKDIR /app

# Instalar dependências do sistema
RUN apk add --no-cache curl dumb-init

# Copiar configurações npm primeiro
COPY package*.json .npmrc ./

# Instalar dependências
RUN npm install --legacy-peer-deps --no-audit --no-fund

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Verificar se build foi criado
RUN test -f dist/server/production.js && test -f dist/spa/index.html

# Limpar dependências de dev para reduzir tamanho
RUN npm prune --production --legacy-peer-deps

# Configurar usuário não-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# Configurações de ambiente
ENV NODE_ENV=production
ENV PORT=80

# Mudar para usuário não-root
USER nodejs

# Expor porta
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:80/health || exit 1

# Start com dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server/production.js"]
