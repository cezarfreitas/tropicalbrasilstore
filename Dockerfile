# Dockerfile Ultra-Simplificado para Produção
FROM node:22-alpine

WORKDIR /app

# Instalar dependências do sistema
RUN apk add --no-cache \
    curl \
    bash \
    git

# Copiar configurações primeiro
COPY package*.json ./
COPY tsconfig.json ./

# Instalar dependências
RUN npm ci --legacy-peer-deps

# Copiar código fonte
COPY . .

# Criar diretórios de upload
RUN mkdir -p public/uploads/logos public/uploads/products

# Build da aplicação
RUN npm run build

# Copiar uploads se existirem
RUN if [ -d "public/uploads" ]; then \
      mkdir -p dist/public && \
      cp -r public/uploads dist/public/; \
    fi

# Verificações de build - compatível com Alpine
RUN echo "✅ Verificando arquivos de build..." && \
    ls -la dist/server/production.js && \
    ls -la dist/spa/index.html && \
    echo "✅ Build concluído com sucesso"

# Verificar assets em detalhes - compatível com Alpine  
RUN echo "📦 Verificando assets em detalhes:" && \
    ls -la dist/spa/ && \
    echo "📦 Conteúdo da pasta assets:" && \
    ls -la dist/spa/assets/ && \
    echo "📦 Tamanho dos arquivos assets:" && \
    du -h dist/spa/assets/*

# Verificar conteúdo do index.html
RUN echo "📄 Conteúdo do index.html:" && \
    cat dist/spa/index.html

# Verificar estrutura completa - compatível com Alpine
RUN echo "🗂️ Estrutura completa do diretório dist:" && \
    find dist -type f -print | head -20

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

# Start da aplicação
CMD ["node", "dist/server/production.js"]
