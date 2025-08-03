# Dockerfile para EasyPanel - Modo Desenvolvimento
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

# Porta 80 para EasyPanel
ENV PORT=80
ENV NODE_ENV=development

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:80/health || exit 1

# Iniciar em modo desenvolvimento com host permitido
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "80", "--clearScreen", "false"]
