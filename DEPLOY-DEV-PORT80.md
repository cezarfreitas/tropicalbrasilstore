# 🚀 Deploy Desenvolvimento - Porta 80

## 📋 Opções de Deploy Criadas:

### 🥇 **Opção 1: Docker Compose** (Recomendado)
```bash
chmod +x docker-dev-port80.sh
./docker-dev-port80.sh
```
- ✅ **Isolamento completo**
- ✅ **Fácil de parar/reiniciar**
- ✅ **Logs organizados**

### 🥈 **Opção 2: Script Direto** (Precisa sudo)
```bash
chmod +x deploy-dev-port80.sh
sudo ./deploy-dev-port80.sh
```
- ✅ **Execução direta**
- ⚠️ **Requer privilégios de administrador**

### 🥉 **Opção 3: NPM Scripts**
```bash
# Build primeiro
npm run build

# Iniciar (precisa sudo para porta 80)
sudo npm run start:dev:port80
```

## 🔧 Arquivos Criados:

- **`deploy-dev-port80.sh`** - Script principal de deploy
- **`docker-dev-port80.sh`** - Deploy via Docker Compose
- **`docker-compose.dev-port80.yml`** - Configuração Docker
- **`Dockerfile.dev-port80`** - Container de desenvolvimento
- **`.env.dev-port80`** - Variáveis de ambiente

## ⚙️ Configuração de Desenvolvimento:

```bash
NODE_ENV=development
PORT=80
DEBUG_MODE=true
CORS_ORIGIN=http://localhost
```

## 📍 URLs de Acesso:

- **Aplicação**: http://localhost
- **Admin**: http://localhost/admin
- **Loja**: http://localhost/loja
- **Health Check**: http://localhost/health
- **API**: http://localhost/api

## 🛠️ Comandos Úteis:

### Docker
```bash
# Ver logs
docker logs chinelos-dev-port80

# Parar
docker-compose -f docker-compose.dev-port80.yml down

# Rebuild
docker-compose -f docker-compose.dev-port80.yml up --build --force-recreate
```

### NPM
```bash
# Deploy via Docker
npm run docker:dev:port80

# Parar Docker
npm run docker:dev:port80:down

# Deploy direto (precisa sudo)
sudo npm run deploy:dev:port80
```

## 🔍 Troubleshooting:

### Porta 80 em uso
```bash
# Ver o que está usando
sudo netstat -tulpn | grep :80

# Parar Apache/Nginx se estiver rodando
sudo systemctl stop apache2
sudo systemctl stop nginx
```

### Permissões
```bash
# Para porta 80, sempre use sudo
sudo ./deploy-dev-port80.sh

# Ou use Docker (não precisa sudo)
./docker-dev-port80.sh
```

### Container não inicia
```bash
# Ver logs detalhados
docker logs chinelos-dev-port80

# Verificar se porta está livre
docker ps -a
```

## ✨ Características do Desenvolvimento:

✅ **Debug mode ativo**  
✅ **CORS liberado para localhost**  
✅ **Compressão desabilitada**  
✅ **Logs detalhados**  
✅ **Hot reload (se suportado)**  
✅ **Health check funcional**  

## 🎯 Recomendação:

**Use a Opção 1** (Docker):
```bash
chmod +x docker-dev-port80.sh
./docker-dev-port80.sh
```

É a mais robusta e não requer sudo!
