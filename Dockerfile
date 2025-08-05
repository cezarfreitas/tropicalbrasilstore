# Multi-stage Dockerfile para Produção Profissional
FROM node:18-alpine AS builder

# Instalar dependências necessárias para build
RUN apk add --no-cache python3 make g++ curl

WORKDIR /app

# Copiar arquivos de configuração primeiro (cache layer)
COPY package*.json ./
COPY tsconfig.json ./
COPY vite.config*.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY build.js ./

# Instalar todas as dependências (incluindo dev para build)
RUN npm ci --legacy-peer-deps

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Verificar se build foi criado corretamente
RUN test -f dist/server/production.js || (echo "❌ Build falhou - production.js não encontrado" && exit 1)
RUN test -f dist/spa/index.html || (echo "❌ Build falhou - index.html não encontrado" && exit 1)

# Stage de produção
FROM node:18-alpine AS production

# Instalar dependências de sistema para produção
RUN apk add --no-cache \
    curl \
    dumb-init \
    && addgroup -g 1001 -S nodejs \
    && adduser -S nodejs -u 1001

WORKDIR /app

# Copiar package.json para instalar apenas deps de produção
COPY package*.json ./

# Instalar apenas dependências de produção
RUN npm ci --omit=dev --legacy-peer-deps && npm cache clean --force

# Copiar arquivos buildados do stage anterior
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/public ./public

# Criar diretórios necessários
RUN mkdir -p public/uploads/logos public/uploads/products \
    && chown -R nodejs:nodejs public/uploads

# Configurações de ambiente
ENV NODE_ENV=production
ENV PORT=80
ENV NPM_CONFIG_PRODUCTION=true

# Usar usuário não-root
USER nodejs

# Expor porta
EXPOSE 80

# Health check robusto
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:80/health || exit 1

# Usar dumb-init para handle de sinais
ENTRYPOINT ["dumb-init", "--"]

# Comando de start
CMD ["node", "dist/server/production.js"]
