# ⚡ EasyPanel Deploy - Resumo Rápido

## 🎯 Configuração Mínima

### **Variáveis de Ambiente:**
```env
NODE_ENV=production
PORT=80
DATABASE_URL=mysql://tropical:805ce7692e5b4d6ced5f@5.161.52.206:3232/tropical
```

### **Configurações Docker:**
- **Port Mapping**: `80:80`
- **Health Check**: `/health`
- **Dockerfile**: Na raiz do projeto

### **Build & Deploy:**
1. Push código para Git
2. Criar projeto no EasyPanel (Docker)
3. Configurar variáveis de ambiente
4. Deploy automático

## ✅ Verificação Rápida

- **Health**: `https://seu-dominio.com/health`
- **App**: `https://seu-dominio.com/`
- **Admin**: `https://seu-dominio.com/admin`

---

**🚀 Deploy em 5 minutos!**
