# 🚨 EMERGÊNCIA - EasyPanel Não Acessa Site

## ⚡ **SOLUÇÕES IMEDIATAS (teste na ordem):**

### 🔄 **1. RESTART COMPLETO**

```bash
# No EasyPanel interface:
# 1. Ir em "Services" > Sua aplicação
# 2. Clicar em "Stop"
# 3. Aguardar parar completamente
# 4. Clicar em "Start"
# 5. Verificar logs em tempo real
```

### 🚀 **2. DEPLOY FORÇADO**

```bash
# No EasyPanel:
# 1. Ir em "Services" > Sua aplicação > "Source"
# 2. Clicar em "Deploy"
# 3. Aguardar build completo
# 4. Verificar se sobe sem erros
```

### 🔧 **3. CONFIGURAÇÃO DE PORTA SIMPLIFICADA**

No EasyPanel, altere para:

```
Port: 3000
Environment Variables:
- PORT=3000
- NODE_ENV=production
- DATABASE_URL=sua_database_url
```

### 📦 **4. DOCKERFILE SIMPLIFICADO**

Substitua o Dockerfile por esta versão minimalista:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Build
RUN npm run build

# Expose port
EXPOSE 3000

# Start
CMD ["npm", "start"]
```

### 🌐 **5. TESTE COM SERVIDOR BÁSICO**

Crie arquivo `simple-server.js`:

```javascript
const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static("dist"));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", port: PORT, timestamp: new Date() });
});

// Catch all
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Access: http://localhost:${PORT}`);
});
```

E altere o `package.json`:

```json
{
  "scripts": {
    "start": "node simple-server.js"
  }
}
```

### 🎯 **6. VERIFICAÇÃO FINAL**

Após qualquer mudança, teste:

```bash
# No terminal do EasyPanel
curl http://localhost:3000/health
```

**Deve retornar:**

```json
{ "status": "OK", "port": 3000, "timestamp": "..." }
```

## 📱 **ACESSOS ESPERADOS:**

### ✅ **Interno (no servidor):**

- `http://localhost:3000`
- `http://127.0.0.1:3000`

### ✅ **Externo (pelo browser):**

- `https://SEU_DOMINIO.easypanel.host`
- `http://IP_DO_SERVIDOR:3000` (se porta aberta)

## 🚨 **SE AINDA NÃO FUNCIONAR:**

### **Opção A: Usar porta diferente**

- EasyPanel Port: `8080`
- Environment: `PORT=8080`
- Dockerfile: `EXPOSE 8080`

### **Opção B: Debug mode**

```javascript
// Adicionar ao server
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - ${new Date()}`);
  next();
});
```

### **Opção C: Verificar se EasyPanel proxy funciona**

```bash
# Criar arquivo index.html básico
echo "<h1>TESTE EASYPANEL</h1>" > dist/index.html

# Servidor estático Python
cd dist && python3 -m http.server 3000
```

## 📞 **CONTATO SUPORTE EASYPANEL**

Se nada funcionar, pode ser problema específico do EasyPanel:

- Verificar status da plataforma
- Contatar suporte com logs específicos
- Testar em outro serviço (Railway, Render) temporariamente

**Teste estas soluções na ordem e me informe qual funcionou!** 🎯
