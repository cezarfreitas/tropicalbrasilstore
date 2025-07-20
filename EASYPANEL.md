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

- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Node Version**: 22

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
