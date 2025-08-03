# 🚀 Deploy no EasyPanel - Guia Simples

## 📋 Passo a Passo

### 1. **Criar Novo Projeto no EasyPanel**
- Acesse seu painel EasyPanel
- Clique em "New Project"
- Escolha "Docker"

### 2. **Configurar Repository**
- **Repository URL**: URL do seu repositório Git
- **Branch**: `main`
- **Build Path**: `/`
- **Dockerfile**: `Dockerfile` (na raiz)

### 3. **Variáveis de Ambiente**

Configure estas variáveis no EasyPanel:

```env
NODE_ENV=production
PORT=80
DATABASE_URL=mysql://user:password@host:port/database
```

**Exemplo com seu banco:**
```env
NODE_ENV=production
PORT=80
DATABASE_URL=mysql://tropical:805ce7692e5b4d6ced5f@5.161.52.206:3232/tropical
```

### 4. **Configurações do Container**

- **Port Mapping**: `80:80`
- **Health Check Path**: `/health`
- **Health Check Port**: `80`
- **Health Check Protocol**: `HTTP`

### 5. **Deploy**

1. Clique em "Deploy"
2. Aguarde o build (pode demorar 3-5 minutos)
3. Verifique se o status fica "Healthy"

## ✅ Verificação

Após o deploy:

1. **Health Check**: `https://seu-dominio.com/health`
2. **API**: `https://seu-dominio.com/api/ping`
3. **App**: `https://seu-dominio.com/`

## 🆘 Troubleshooting

### ❌ Build falhou:
- Verificar logs do build
- Confirmar se Dockerfile está na raiz

### ❌ Container não inicia:
- Verificar variáveis de ambiente
- Verificar logs do container

### ❌ Health Check falha:
- Aguardar 60s (start period)
- Verificar se porta 80 está exposta
- Verificar endpoint `/health`

### ❌ App não carrega:
- Verificar se domínio aponta para porta 80
- Verificar logs da aplicação

## 📊 Resposta do Health Check

```json
{
  "status": "healthy",
  "timestamp": "2024-08-03T02:00:00.000Z",
  "version": "1.0.0",
  "environment": "production"
}
```

---

**✨ Deploy simples e direto no EasyPanel!**
