# 🚀 Deploy EasyPanel - Modelo Desenvolvimento

## ✅ Configuração Simplificada

### 1. Variáveis de Ambiente

```env
# Database
DB_PASSWORD=sua_senha_aqui
DB_ROOT_PASSWORD=senha_root_aqui

# Opcionais
DB_USER=chinelos_user
DB_NAME=chinelos_store
NODE_ENV=development
PORT=3000
```

### 2. Deploy

```bash
./deploy.sh docker
```

## 🔧 Características

- **Modo**: Desenvolvimento (como Fly.dev)
- **Servidor**: Vite dev server
- **Build**: Não necessário
- **Assets**: Servidos pelo Vite
- **Hot Reload**: Ativo

## 📊 Endpoints

- **Aplicação**: `http://localhost:3000`
- **Admin**: `http://localhost:3000/admin`
- **API**: `http://localhost:3000/api`

## 🆘 Troubleshooting

```bash
# Ver logs
docker-compose logs -f app

# Restart
docker-compose restart app

# Rebuild
docker-compose build --no-cache app
```

---

**✨ Sistema simplificado - 100% compatível com EasyPanel!**
