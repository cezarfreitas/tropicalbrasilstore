# 🔍 Guia Completo de Debug - EasyPanel

## 📊 Status Atual Identificado:
- ✅ **Container**: Iniciando corretamente
- ✅ **Servidor**: Rodando na porta 3000
- ❌ **Proxy/Rede**: Não consegue rotear o tráfego

---

## 🔧 1. **Verificação de Logs no EasyPanel**

### **1.1 Logs do Container**
No painel do EasyPanel:
```
1. Vá em "Projects" → "b2btropical"
2. Clique em "Logs" 
3. Procure por:
   ✅ "✅ EasyPanel Force server running on http://0.0.0.0:3000"
   ✅ "💗 EasyPanel server alive - uptime: XXXs"
   ❌ Erros de rede ou proxy
```

### **1.2 Logs de Build**
```
1. Vá em "Deployments"
2. Clique no último deploy
3. Verifique se terminou com "BUILD SUCCESSFUL"
```

### **1.3 Logs do Sistema**
```
1. Procure por mensagens sobre:
   - Port binding errors
   - Proxy configuration issues
   - Network connectivity problems
```

---

## ⚙️ 2. **Verificação de Configurações**

### **2.1 Environment Variables**
No painel do EasyPanel, verifique se existem:
```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://tropical:805ce7692e5b4d6ced5f@5.161.52.206:3232/tropical
```

### **2.2 Port Configuration**
```
1. Vá em "Settings" → "Network"
2. Verifique se:
   - Container Port: 3000
   - External Port: 80 ou 443
   - Protocol: HTTP
```

### **2.3 Domain Configuration**
```
1. Vá em "Domains"
2. Verifique:
   - Domain: ide-b2btropical.jzo3qo.easypanel.host
   - Target: Container correto
   - SSL Certificate: Ativo
```

---

## 🌐 3. **Testes de Conectividade**

### **3.1 Teste Interno do Container**
Se você tem acesso SSH ao servidor:
```bash
# Encontrar o container
docker ps | grep b2btropical

# Testar dentro do container
docker exec -it [CONTAINER_ID] curl http://localhost:3000/health

# Verificar se porta está aberta
docker exec -it [CONTAINER_ID] netstat -tulpn | grep :3000
```

### **3.2 Teste de Proxy**
```bash
# Testar proxy do EasyPanel
curl -v https://ide-b2btropical.jzo3qo.easypanel.host/health
curl -v http://ide-b2btropical.jzo3qo.easypanel.host/health

# Verificar headers de resposta
curl -I https://ide-b2btropical.jzo3qo.easypanel.host/
```

### **3.3 Teste Direto de IP**
```bash
# Se souber o IP do servidor
curl http://[SERVER_IP]:3000/health
```

---

## 🔄 4. **Soluções Tentativas**

### **4.1 Restart do Serviço**
```
1. No EasyPanel: "Actions" → "Restart"
2. Aguarde logs: "✅ EasyPanel Force server running"
3. Teste acesso após 30 segundos
```

### **4.2 Rebuild da Aplicação**
```
1. "Actions" → "Deploy"
2. Force rebuild: ✅
3. Aguarde build completo
4. Verifique logs de startup
```

### **4.3 Mudança de Port**
Tente mudar para porta 8080:
```javascript
// Editar server/easypanel-force.js
const port = process.env.PORT || 8080;
```

### **4.4 Configuração de Health Check**
No EasyPanel:
```
Health Check Path: /health
Health Check Port: 3000
Health Check Protocol: HTTP
```

---

## 🚨 5. **Problemas Comuns e Soluções**

### **5.1 Proxy Não Configurado**
**Sintoma**: "Service is not reachable"
**Solução**: 
```
1. Vá em "Network" → "Proxy"
2. Adicione regra:
   - From: ide-b2btropical.jzo3qo.easypanel.host
   - To: Container:3000
```

### **5.2 SSL Certificate**
**Sintoma**: HTTPS não funciona
**Solução**:
```
1. "Domains" → "SSL"
2. "Regenerate Certificate"
3. Aguarde propagação (5-10min)
```

### **5.3 Firewall/Security Groups**
**Sintoma**: Timeout de conexão
**Solução**:
```
1. Verificar firewall do servidor
2. Liberar portas 80, 443, 3000
3. Verificar security groups (se cloud)
```

### **5.4 DNS Issues**
**Sintoma**: Domain não resolve
**Solução**:
```bash
# Testar resolução DNS
nslookup ide-b2btropical.jzo3qo.easypanel.host
dig ide-b2btropical.jzo3qo.easypanel.host
```

---

## 🔬 6. **Debug Avançado**

### **6.1 Criar Test Endpoint**
Adicione endpoint de debug:
```javascript
// Em server/easypanel-force.js
app.get("/debug", (req, res) => {
  res.json({
    container_ip: req.ip,
    headers: req.headers,
    host: req.get('host'),
    protocol: req.protocol,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});
```

### **6.2 Verificar Network Mode**
```bash
# Verificar modo de rede do container
docker inspect [CONTAINER_ID] | grep NetworkMode
```

### **6.3 Logs Detalhados**
Adicione mais logs ao servidor:
```javascript
// Adicionar middleware de log
app.use((req, res, next) => {
  console.log(`🌐 ${new Date().toISOString()} - ${req.method} ${req.url} from ${req.ip}`);
  next();
});
```

---

## 📝 7. **Checklist de Verificação**

### **Configuração EasyPanel:**
- [ ] Environment variables configuradas
- [ ] Port 3000 mapeado corretamente
- [ ] Domain configurado e SSL ativo
- [ ] Proxy rules configuradas
- [ ] Health check configurado

### **Container Status:**
- [ ] Container rodando sem restart loops
- [ ] Logs mostram "server running"
- [ ] Health endpoint responde internamente
- [ ] Sem erros de binding de porta

### **Network/Proxy:**
- [ ] DNS resolve corretamente
- [ ] Firewall permite tráfego
- [ ] Load balancer/proxy configurado
- [ ] SSL certificate válido

---

## 🎯 8. **Comandos de Debug Específicos**

### **Se tiver acesso SSH ao servidor EasyPanel:**
```bash
# 1. Verificar containers rodando
docker ps | grep tropical

# 2. Logs do container
docker logs [CONTAINER_ID] --tail 50 -f

# 3. Testar porta internamente
docker exec [CONTAINER_ID] curl http://localhost:3000/health

# 4. Verificar configuração de rede
docker network ls
docker network inspect [NETWORK_NAME]

# 5. Verificar proxy/nginx
systemctl status nginx
nginx -t
cat /etc/nginx/sites-enabled/default

# 6. Testar conectividade
telnet localhost 3000
wget -O- http://localhost:3000/health
```

---

## 🎯 **Próximos Passos Recomendados:**

1. **Verificar logs** do container no EasyPanel
2. **Confirmar configurações** de porta e domínio
3. **Testar health check** interno
4. **Verificar proxy rules** 
5. **Restart do serviço** se necessário
6. **Contatar suporte** do EasyPanel se problema persistir

### 📞 **Se tudo falhar:**
- Migrar para **Fly.io** (que já está funcionando)
- Usar **Railway** ou **Render** como alternativa
- Configurar **VPS manual** com Docker

---

**Este guia deve identificar exatamente onde está o problema no EasyPanel!** 🔍
