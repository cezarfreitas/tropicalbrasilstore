# 🚀 Deploy Rápido - Chinelos Store

## ⚡ Deploy em 2 Minutos

### 🐳 Docker Compose (Easy Panel/Local)

```bash
# 1. Configure environment
cp .env.example .env
# Edit .env with your database passwords

# 2. Deploy
./deploy.sh docker
```

### ☁️ Cloud Platforms (Railway/Render/Fly.io)

```bash
# 1. Prepare
./deploy.sh

# 2. Deploy
# Railway: railway up
# Render: git push
# Fly.io: fly deploy
```

## 🔧 Environment Variables

### Essenciais:

```env
DATABASE_URL=mysql://user:pass@host:port/db
NODE_ENV=production
```

### Docker Compose:

```env
DB_PASSWORD=your_password
DB_ROOT_PASSWORD=root_password
```

## ✅ Verificação

- **Health Check**: `/health`
- **Application**: `http://localhost:3000`
- **Admin**: `http://localhost:3000/admin`

## 🆘 Problemas Comuns

- **Build Error**: `npm run build` - Fix TypeScript errors
- **DB Connection**: Check DATABASE_URL format
- **Docker Issues**: `docker-compose logs app`

---

✨ **Sistema 100% reformulado para máxima compatibilidade!**
