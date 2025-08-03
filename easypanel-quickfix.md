# ⚡ Quick Fix Commands - EasyPanel

## 🚨 Comandos de Emergência (Execute em Sequência)

### 1️⃣ Verificação Rápida
```bash
# Executar o diagnóstico automatizado
chmod +x easypanel-diagnostic.sh
./easypanel-diagnostic.sh
```

### 2️⃣ Se Container Não Está Rodando
```bash
# Verificar containers parados
docker ps -a

# Iniciar container parado
docker start $(docker ps -a -q)

# Verificar logs para erros
docker logs $(docker ps -q) --tail=20
```

### 3️⃣ Se Container Roda Mas Não Responde (MAIS COMUM)
```bash
# Testar se responde internamente
docker exec $(docker ps -q) curl -I http://localhost:80

# Se não responder, verificar processo
docker exec $(docker ps -q) ps aux | grep node

# Verificar porta binding
docker exec $(docker ps -q) netstat -tlnp | grep :80
```

### 4️⃣ Problema de Port Mapping
```bash
# Verificar port mapping atual
docker port $(docker ps -q)

# Se não mostra 80:80, é problema de configuração EasyPanel
```

### 5️⃣ Restart Forçado
```bash
# Parar todos containers
docker stop $(docker ps -q)

# Remover containers
docker rm $(docker ps -a -q)

# Rebuild e restart (via EasyPanel interface)
```

## 🎯 Teste de Conectividade Direto

### Teste 1: Servidor Responde?
```bash
curl -I http://localhost:80
```
**Se falhar:** Problema de proxy/network

### Teste 2: Health Endpoint
```bash
curl http://localhost:80/health
```
**Se falhar:** Aplicação não está rodando corretamente

### Teste 3: API Responde?
```bash
curl http://localhost:80/api/health
```
**Se falhar:** Backend não está funcionando

## 🔧 Fix Específicos por Problema

### ❌ "Connection Refused"
```bash
# Container não está rodando ou porta errada
docker ps
docker logs $(docker ps -q)
```

### ❌ "Service Not Reachable" 
```bash
# Problema de proxy/port mapping
docker port $(docker ps -q)
# Deve mostrar: 80/tcp -> 0.0.0.0:80
```

### ❌ "504 Gateway Timeout"
```bash
# Aplicação demora para responder
docker exec $(docker ps -q) curl -m 5 http://localhost:80
```

## 🚀 Solução Definitiva (Se nada funcionar)

### Método 1: Deploy com Configuração Fixa
1. No EasyPanel, vá em Settings
2. Port: `80`
3. Environment: `PORT=80`
4. Health Check: `/health`
5. Deploy novamente

### Método 2: Usar Porta Alternativa
```dockerfile
# No Dockerfile, trocar para:
EXPOSE 3000
ENV PORT=3000
```
E no EasyPanel configurar port mapping: `3000:80`

### Método 3: Servidor de Debug
```bash
# Criar arquivo test-server.js no container
echo 'const express = require("express"); const app = express(); app.get("/", (req, res) => res.send("OK")); app.listen(80, "0.0.0.0", () => console.log("Test server on :80"));' > test-server.js

# Rodar servidor de teste
node test-server.js
```

## 📱 Verificação Final

Se após todos os fixes o frontend deveria estar em:
- **Interno:** `http://localhost:80` ✅
- **Externo:** `http://SEU_DOMINIO_EASYPANEL` ✅

**Última verificação:**
```bash
curl -I http://localhost:80 && echo "✅ FUNCIONANDO" || echo "❌ AINDA COM PROBLEMA"
```
