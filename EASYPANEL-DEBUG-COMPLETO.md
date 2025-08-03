# Guia Completo de Debugging EasyPanel VPS

## Problema Identificado

- ✅ Sistema funciona 100% no Fly.io
- ❌ EasyPanel mostra "Service is not reachable"
- 📱 Frontend deveria estar em: `http://localhost:80`

## 🔍 1. Verificação de Status do Container

### 1.1 Verificar se o container está rodando

```bash
docker ps -a
```

**Busque por:** Container com status "Up" para sua aplicação

### 1.2 Verificar logs do container

```bash
docker logs <container_name> --tail=100 -f
```

**Verifique se vê:**

- `Server running on port 80`
- `Database connected successfully`
- **NÃO deve haver:** erros de binding de porta

## 🌐 2. Teste de Conectividade Interna

### 2.1 Acessar o container diretamente

```bash
docker exec -it <container_name> /bin/sh
```

### 2.2 Testar se o serviço responde internamente

```bash
# Dentro do container
curl -I http://localhost:80
curl -I http://127.0.0.1:80
```

**Resposta esperada:**

```
HTTP/1.1 200 OK
Content-Type: text/html
```

### 2.3 Verificar processos rodando

```bash
# Dentro do container
ps aux | grep node
netstat -tlnp | grep :80
```

## 🔧 3. Configuração de Rede EasyPanel

### 3.1 Verificar configuração do serviço no EasyPanel

- **Port Mapping:** `80:80` ou `internal:80` → `external:80`
- **Health Check:** `/health` endpoint
- **Domain/Subdomain:** Configurado corretamente

### 3.2 Verificar proxy reverso

```bash
# No host do VPS (fora do container)
curl -I http://localhost:80
curl -I http://127.0.0.1:80
```

### 3.3 Verificar iptables/firewall

```bash
# Verificar regras de firewall
iptables -L
ufw status
```

## 🚀 4. Teste com Servidor de Debug

### 4.1 Criar servidor temporário de teste

```bash
# Dentro do container ou VPS
python3 -m http.server 80
```

### 4.2 Testar conectividade externa

```bash
# De outra máquina
curl -I http://SEU_VPS_IP:80
```

## 📋 5. Verificação de Configuração EasyPanel

### 5.1 Dockerfile correto para EasyPanel

Verifique se está usando:

```dockerfile
EXPOSE 80
CMD ["node", "server/index.js"]
```

### 5.2 Variáveis de ambiente

Confirme no EasyPanel:

- `PORT=80`
- `NODE_ENV=production`
- Database credentials corretas

### 5.3 Health check endpoint

Teste se `/health` responde:

```bash
curl http://localhost:80/health
```

## 🔍 6. Logs de Sistema

### 6.1 Logs do EasyPanel

- Acesse o dashboard do EasyPanel
- Vá em Logs → Application Logs
- Procure por:
  - Erros de binding de porta
  - Timeouts de conexão
  - Problemas de proxy

### 6.2 Logs do sistema VPS

```bash
# Logs gerais do sistema
journalctl -xe

# Logs do Docker
journalctl -u docker.service

# Logs específicos do nginx/proxy (se usado)
tail -f /var/log/nginx/error.log
```

## 🛠️ 7. Soluções Específicas

### 7.1 Se porta 80 não responde

```bash
# Verificar se algo está usando a porta
lsof -i :80
```

### 7.2 Se proxy não funciona

Teste com porta alternativa:

```dockerfile
EXPOSE 3000
```

E configure port mapping: `3000:80`

### 7.3 Se health check falha

Adicione endpoint simples:

```javascript
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});
```

## 🚨 8. Comandos de Emergência

### 8.1 Restart completo

```bash
# No EasyPanel
docker-compose down
docker-compose up -d

# Ou via CLI
docker restart <container_name>
```

### 8.2 Rebuild forçado

```bash
# Limpar cache e rebuild
docker system prune -f
docker build --no-cache -t chinelos-app .
```

### 8.3 Teste com servidor minimal

```javascript
// test-server.js
const express = require("express");
const app = express();
app.get("/", (req, res) => res.send("OK"));
app.listen(80, "0.0.0.0", () => console.log("Test server on :80"));
```

## 📊 9. Checklist de Verificação

### ✅ Container

- [ ] Container está rodando (`docker ps`)
- [ ] Logs mostram "Server running on port 80"
- [ ] Sem erros no startup
- [ ] Health check endpoint responde

### ✅ Rede

- [ ] Porta 80 não está em uso por outro serviço
- [ ] `curl localhost:80` funciona dentro do container
- [ ] Port mapping está correto (80:80)
- [ ] Firewall permite tráfego na porta 80

### ✅ EasyPanel

- [ ] Domain/subdomain configurado
- [ ] SSL/HTTPS configurado corretamente
- [ ] Proxy reverso funcionando
- [ ] Não há conflitos de rota

### ✅ Aplicação

- [ ] Variáveis de ambiente corretas
- [ ] Database conectando
- [ ] Assets sendo servidos
- [ ] API endpoints respondendo

## 🎯 10. Comando de Diagnóstico Completo

Execute este script para diagnóstico automatizado:

```bash
#!/bin/bash
echo "=== DIAGNÓSTICO EASYPANEL ==="
echo "1. Status do Container:"
docker ps -a | grep chinelos

echo -e "\n2. Logs Recentes:"
docker logs chinelos-app --tail=20

echo -e "\n3. Teste Interno:"
docker exec chinelos-app curl -s -I http://localhost:80

echo -e "\n4. Porta em Uso:"
lsof -i :80

echo -e "\n5. Processos Node:"
docker exec chinelos-app ps aux | grep node

echo -e "\n6. Teste Health:"
curl -s http://localhost:80/health
```

## 📞 Próximos Passos

1. **Execute os comandos na ordem apresentada**
2. **Anote os resultados de cada teste**
3. **Identifique onde o problema ocorre (container, rede, proxy)**
4. **Aplique a solução específica**

Se após todos esses testes o problema persistir, isso indica um problema de configuração específico do EasyPanel que pode requerer suporte técnico da plataforma.
