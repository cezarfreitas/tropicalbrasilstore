# 🚀 EasyPanel Setup - Banco Externo

## 📋 Configuração no EasyPanel

### 1. **Variáveis de Ambiente**

Configure estas variáveis no EasyPanel:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=mysql://tropical:805ce7692e5b4d6ced5f@5.161.52.206:3232/tropical
```

### 2. **Health Check**

Configure o Health Check no EasyPanel:

- **Path**: `/health`
- **Port**: `3000`
- **Protocol**: `HTTP`
- **Interval**: `30s`
- **Timeout**: `10s`
- **Start Period**: `60s`

### 3. **Port Mapping**

- **Container Port**: `3000`
- **External Port**: `80` ou `443`

### 4. **Dockerfile**

Use o Dockerfile na raiz do projeto (já configurado).

## ✅ Verificação

Após o deploy, verifique:

1. **Health Check**: `https://seu-dominio.com/health`
2. **API**: `https://seu-dominio.com/api/ping`
3. **Frontend**: `https://seu-dominio.com/`

## 🔧 Resposta do Health Check

```json
{
  "status": "healthy",
  "timestamp": "2024-08-03T01:40:00.000Z",
  "version": "1.0.0",
  "environment": "development"
}
```

## 🆘 Troubleshooting

### Container não inicia:
- Verificar variáveis de ambiente
- Verificar logs do container

### Health Check falha:
- Verificar se porta 3000 está exposta
- Verificar se `/health` está acessível
- Aguardar start period (60s)

### Banco não conecta:
- Verificar DATABASE_URL
- Verificar conectividade de rede
- Verificar credenciais

---

**✨ Sistema configurado para banco externo com health check!**
