# 🚀 Deploy Guide - Chinelos Admin

Este projeto está configurado para deploy com **Nixpacks**, compatível com plataformas como Railway, Render, Fly.io e outras.

## 📋 Pré-requisitos

- Node.js 22+
- MySQL Database
- Plataforma compatível com Nixpacks

## 🔧 Configuração de Ambiente

### Variáveis de Ambiente Obrigatórias

```bash
# Database - Use uma dessas opções:

# Opção 1: URL completa do banco
DATABASE_URL=mysql://user:password@host:port/database

# Opção 2: Variáveis individuais
MYSQL_HOST=your-mysql-host
MYSQL_USER=your-username
MYSQL_PASSWORD=your-password
MYSQL_DATABASE=your-database-name
MYSQL_PORT=3306

# Configuração do servidor
NODE_ENV=production
PORT=3000
```

### Variáveis Opcionais

```bash
DB_CONNECTION_LIMIT=10
APP_NAME="Chinelos Admin"
APP_VERSION="1.0.0"
```

## 🏗�� Estrutura de Build

O projeto usa **Vite** para build otimizado:

- **Frontend**: React + TypeScript → `dist/spa/`
- **Backend**: Express + TypeScript → `dist/server/`
- **Static Files**: Servidos automaticamente pelo Express

## 📦 Deploy com Nixpacks

### Railway

```bash
railway login
railway new
railway add
railway up
```

### Render

1. Conecte seu repositório Git
2. Configure as variáveis de ambiente
3. Deploy automático no push

### Fly.io

```bash
fly auth login
fly launch
fly deploy
```

### Docker (Alternativa)

```bash
docker build -t chinelos-admin .
docker run -p 3000:3000 --env-file .env chinelos-admin
```

## 🏃‍♂️ Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Start produção local
npm start

# Testes
npm test

# Type checking
npm run typecheck
```

## 📁 Arquivos de Configuração

- `nixpacks.toml` - Configuração do Nixpacks
- `Dockerfile` - Backup para deploy Docker
- `.env.example` - Template de variáveis de ambiente
- `deploy.sh` - Script de verificação pré-deploy

## 🔍 Health Check

O aplicativo inclui endpoint de health check:

```
GET /health
```

Resposta:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "version": "1.0.0",
  "environment": "production"
}
```

## 🗄️ Database Setup

O banco de dados é inicializado automaticamente na primeira execução com:

- Tabelas necessárias
- Dados de exemplo (categorias, cores, tamanhos)
- Estrutura completa do sistema

## 📊 Monitoramento

- **Health Check**: `/health`
- **API Status**: `/api/ping`
- **Logs**: Estruturados para análise
- **Error Handling**: Respostas consistentes

## 🔧 Troubleshooting

### Erro de Conexão com Database

- Verifique as variáveis `DATABASE_URL` ou `MYSQL_*`
- Confirme que o banco está acessível
- Teste conectividade de rede

### Build Failures

- Execute `npm run typecheck` localmente
- Verifique dependências com `npm ci`
- Confirme versão do Node.js (22+)

### Performance Issues

- Ajuste `DB_CONNECTION_LIMIT`
- Monitor logs de conexão
- Considere uso de CDN para assets

## 🎯 Próximos Passos

Após deploy:

1. ✅ Configurar domínio personalizado
2. ✅ Configurar SSL/HTTPS
3. ✅ Configurar backup do banco
4. ✅ Monitoramento e alertas
5. ✅ CI/CD pipeline

---

**Projeto pronto para produção!** 🎉
