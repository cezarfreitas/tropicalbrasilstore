# 🚀 Deploy no EasyPanel

## 🔧 Configuração Necessária

### Variáveis de Ambiente

Configure estas variáveis no EasyPanel:

```bash
# Obrigatórias
DATABASE_URL=mysql://user:password@host:port/database
NODE_ENV=production

# Opcionais
PORT=3000
DB_CONNECTION_LIMIT=10
```

### Build Settings

O projeto está configurado para usar **Nixpacks** automaticamente.

- **Build Command**: `npm run build:deploy` (otimizado para deploy)
- **Start Command**: `npm start`
- **Node Version**: 18 (recomendado para estabilidade)

#### Scripts Disponíveis:
- `npm run build:deploy` - Build ultra-otimizado para deploy (40s timeout)
- `npm run build` - Build rápido para desenvolvimento
- `npm run build:regular` - Build completo sem timeouts

## 📁 Estrutura de Deploy

```
dist/
├── spa/          # Frontend (React)
└── server/       # Backend (Express)
```

## ⚡ Scripts

- `npm run build` - Build completo (client + server)
- `npm start` - Inicia servidor de produção
- `npm run dev` - Desenvolvimento local

## 🔍 Health Check

- **URL**: `/health`
- **Resposta**: JSON com status da aplicação

## 🐛 Troubleshooting

### Build Timeout/Stuck

**Soluções implementadas:**
- ✅ `build-deploy.js` com timeouts agressivos (40s client, 25s server)
- ✅ `Dockerfile.easypanel` com multi-stage build otimizado
- ✅ Variáveis de ambiente para máxima velocidade de build
- ✅ Chunk splitting otimizado (bundle reduzido de 903KB → 665KB)

**Se build ainda estiver lento:**
1. Use `npm run build:deploy` em vez de `npm run build`
2. Configure `NODE_OPTIONS=--max-old-space-size=2048` nas env vars
3. Use Dockerfile.easypanel se precisar de Docker

### Erro "Not a directory" / Undefined Variable

- ✅ Removido Dockerfile conflitante (renomeado para Dockerfile.docker-compose)
- ✅ Configuração Nixpacks simplificada no nixpacks.toml
- ✅ Scripts de build otimizados
- ✅ EasyPanel usa apenas Nixpacks (não Docker)

### Database Connection

- Verifique `DATABASE_URL` nas variáveis de ambiente
- Teste conectividade do banco de dados

### Build Fails

- Verifique logs do build no EasyPanel
- Confirme que todas as dependências estão no package.json

## 🎯 Endpoints Principais

- `/` - Frontend da loja
- `/admin` - Interface administrativa
- `/api/ping` - Status da API
- `/health` - Health check

---

**Deploy pronto para EasyPanel!** 🎉
