# Multi-stage Dockerfile Robusto para Produção
FROM node:18-alpine AS base

# Instalar dependências de sistema necessárias
RUN apk add --no-cache python3 make g++ curl dumb-init

WORKDIR /app

# Stage de build
FROM base AS builder

# Copiar arquivos de configuração (ordem otimizada para cache)
COPY package*.json ./
COPY tsconfig.json ./
COPY vite.config*.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY build.js ./
COPY components.json ./

# Instalar TODAS as dependências (incluindo dev para build)
RUN npm install --legacy-peer-deps --no-audit --no-fund

# Verificar se dependências críticas estão instaladas
RUN node -e "console.log('✅ Dependencies check:', Object.keys(require('./package.json').dependencies).length + Object.keys(require('./package.json').devDependencies).length, 'packages')"

# Copiar código fonte
COPY client/ ./client/
COPY server/ ./server/
COPY shared/ ./shared/
COPY public/ ./public/
COPY index.html ./

# Criar diretórios necessários
RUN mkdir -p dist public/uploads/logos public/uploads/products

# Build com logs detalhados
RUN echo "🔨 Starting build process..." && \
    npm run build && \
    echo "✅ Build completed successfully"

# Verificar se build foi criado corretamente
RUN echo "🔍 Verifying build output..." && \
    test -f dist/server/production.js || (echo "❌ production.js missing" && exit 1) && \
    test -f dist/spa/index.html || (echo "❌ index.html missing" && exit 1) && \
    test -d dist/spa/assets || (echo "❌ assets directory missing" && exit 1) && \
    echo "✅ All build artifacts verified"

# Lista arquivos buildados para debug
RUN echo "📁 Build output structure:" && \
    find dist -type f -name "*.js" -o -name "*.css" -o -name "*.html" | head -10

# Stage de produção
FROM base AS production

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copiar package.json e instalar apenas deps de produção
COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps --no-audit --no-fund && \
    npm cache clean --force

# Copiar arquivos buildados do stage anterior
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/public ./public

# Verificar se arquivos foram copiados corretamente
RUN echo "🔍 Verifying production files..." && \
    test -f dist/server/production.js || (echo "❌ production.js not copied" && exit 1) && \
    test -f dist/spa/index.html || (echo "❌ index.html not copied" && exit 1) && \
    echo "✅ Production files verified"

# Configurar permissões
RUN mkdir -p public/uploads/logos public/uploads/products && \
    chown -R nodejs:nodejs . && \
    chmod -R 755 public/uploads

# Configurações de ambiente
ENV NODE_ENV=production
ENV PORT=80
ENV NPM_CONFIG_PRODUCTION=true

# Usar usuário não-root
USER nodejs

# Expor porta
EXPOSE 80

# Health check otimizado
HEALTHCHECK --interval=30s --timeout=10s --start-period=45s --retries=3 \
    CMD curl -f http://localhost:80/health || exit 1

# Usar dumb-init para gestão de processos
ENTRYPOINT ["dumb-init", "--"]

# Comando de start
CMD ["node", "dist/server/production.js"]
