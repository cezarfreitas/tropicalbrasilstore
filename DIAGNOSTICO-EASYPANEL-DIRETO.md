# 🚨 DIAGNÓSTICO DIRETO - EasyPanel Não Acessa

## ⚡ Execute estes comandos NO SEU VPS EasyPanel:

### 1️⃣ **PRIMEIRO: Verificar se há containers rodando**
```bash
docker ps
```
**Se vazio = Nenhum container rodando (problema principal)**

### 2️⃣ **Verificar containers parados**
```bash
docker ps -a
```
**Deve mostrar containers com status "Exited" ou "Up"**

### 3️⃣ **Verificar se algo está na porta 80**
```bash
netstat -tlnp | grep :80
sudo lsof -i :80
```
**Se vazio = Porta 80 livre (problema!)**

### 4️⃣ **Testar se algo responde na porta 80**
```bash
curl -I http://localhost:80
wget -O- http://localhost:80
```
**Se der erro = Nada rodando na porta 80**

### 5️⃣ **Verificar logs do sistema**
```bash
journalctl -xe | tail -20
docker logs $(docker ps -q) 2>/dev/null || echo "Nenhum container ativo"
```

## 🔧 **SOLUÇÕES POR CENÁRIO:**

### ❌ **CENÁRIO 1: Nenhum container rodando**
```bash
# Verificar se EasyPanel está funcionando
sudo systemctl status docker
sudo systemctl restart docker

# Tentar iniciar containers parados
docker start $(docker ps -a -q)
```

### ❌ **CENÁRIO 2: Container roda mas não responde**
```bash
# Ver se container está "healthy"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Verificar logs específicos
CONTAINER_ID=$(docker ps -q | head -1)
docker logs $CONTAINER_ID --tail=20

# Testar conectividade interna
docker exec $CONTAINER_ID curl -I http://localhost:80
```

### ❌ **CENÁRIO 3: Problema de rede/proxy**
```bash
# Verificar port binding
docker port $(docker ps -q)

# Deve mostrar algo como: 80/tcp -> 0.0.0.0:80
```

## 🚀 **TESTE RÁPIDO - Servidor Temporário**
```bash
# Criar servidor de teste simples
cat > test-server.js << 'EOF'
const http = require('http');
const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('TESTE OK - Servidor funcionando na porta 80!');
});
server.listen(80, '0.0.0.0', () => {
  console.log('Servidor de teste rodando na porta 80');
});
EOF

# Rodar servidor de teste
node test-server.js &

# Testar
curl http://localhost:80
```
**Se funcionar = Problema é com a aplicação, não com o servidor**

## 📱 **VERIFICAÇÃO DA CONFIGURAÇÃO EASYPANEL**

No painel do EasyPanel, verifique:

1. **App Settings:**
   - Port: `80`
   - Environment Variables: `PORT=80`

2. **Domain Settings:**
   - Custom Domain configurado?
   - SSL habilitado?

3. **Health Check:**
   - Path: `/health`
   - Port: `80`

## 🎯 **COMANDO ÚNICO DE DIAGNÓSTICO**
```bash
echo "=== DIAGNÓSTICO RÁPIDO ===" && \
echo "1. Containers:" && docker ps && \
echo "2. Porta 80:" && netstat -tlnp | grep :80 && \
echo "3. Teste HTTP:" && curl -I http://localhost:80 2>/dev/null || echo "FALHOU" && \
echo "4. Docker status:" && sudo systemctl is-active docker
```

## 📞 **Resultados Possíveis:**

### ✅ **Se mostrar containers UP + porta 80 ocupada**
→ Problema de configuração do EasyPanel (proxy/domain)

### ❌ **Se não mostrar containers**
→ Deploy falhou ou containers crasharam

### ⚠️ **Se containers UP mas porta 80 livre**
→ Aplicação não está bindando na porta 80

**Execute estes comandos e me envie os resultados!** 🔍
