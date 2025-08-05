# 🚀 Deploy Final - Desenvolvimento Porta 80

✅ **Servidor de produção funcionando na porta 80!**

## 🎯 **Opções Otimizadas para Desenvolvimento:**

### 🥇 **Opção 1: Script Otimizado** (Mais Rápido)

```bash
chmod +x dev-port80-optimized.sh
sudo ./dev-port80-optimized.sh
```

- ✅ **Build rápido**
- ✅ **Setup automático de ambiente**
- ✅ **Para/reinicia processos automaticamente**

### 🥈 **Opção 2: PM2** (Mais Profissional)

```bash
chmod +x start-dev-pm2.sh
sudo ./start-dev-pm2.sh
```

- ✅ **Gerenciamento avançado de processos**
- ✅ **Logs organizados**
- ✅ **Auto-restart em caso de crash**
- ✅ **Monitoramento em tempo real**

### 🥉 **Opção 3: Docker** (Isolamento Completo)

```bash
./docker-dev-port80.sh
```

- ✅ **Ambiente isolado**
- ✅ **Fácil cleanup**

## 📊 **Comandos PM2 Úteis:**

```bash
# Status da aplicação
sudo pm2 status

# Ver logs em tempo real
sudo pm2 logs chinelos-dev

# Restart da aplicação
sudo pm2 restart chinelos-dev

# Parar aplicação
sudo pm2 stop chinelos-dev

# Monitoramento
sudo pm2 monit
```

## 🔧 **Configurações Criadas:**

- **`dev-port80-optimized.sh`** - Script otimizado
- **`start-dev-pm2.sh`** - Deploy com PM2
- **`ecosystem.dev.config.js`** - Configuração PM2
- **`nginx-dev.conf`** - Configuração Nginx (opcional)

## 🌐 **URLs de Desenvolvimento:**

- **Aplicação**: http://localhost
- **Admin**: http://localhost/admin
- **Loja**: http://localhost/loja
- **Health**: http://localhost/health
- **API**: http://localhost/api

## ⚙️ **Configurações de Desenvolvimento:**

```bash
NODE_ENV=development
PORT=80
DEBUG_MODE=true
LOG_LEVEL=debug
CORS_ORIGIN=http://localhost
```

## 🔄 **Workflow Recomendado:**

1. **Para desenvolvimento rápido**: Use Opção 1
2. **Para desenvolvimento contínuo**: Use Opção 2 (PM2)
3. **Para testes isolados**: Use Opção 3 (Docker)

## 📋 **Scripts NPM Disponíveis:**

```bash
# Deploy otimizado
npm run deploy:dev:optimized

# Deploy com PM2
npm run start:pm2:dev

# Deploy Docker
npm run docker:dev:port80
```

## 🎉 **Pronto para Desenvolvimento!**

Agora você tem uma configuração completa de desenvolvimento na porta 80, com todas as ferramentas necessárias para um ambiente profissional.

**Recomendo usar a Opção 2 (PM2)** para desenvolvimento contínuo!
