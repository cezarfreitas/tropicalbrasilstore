# 🚨 FIX IMEDIATO - Container Rodando Mas App Não Responde

## ❌ **PROBLEMA:**

```
curl: (7) Failed to connect to localhost port 3000 after 0 ms: Could not connect to server
```

## 🔍 **EXECUTE ESTES COMANDOS NO CONTAINER:**

### 1️⃣ **Verificar processos rodando**

```bash
ps aux
```

**Procure por:** `node`, `npm`, `server`

### 2️⃣ **Verificar portas em uso**

```bash
netstat -tlnp
```

**Deve mostrar:** `:3000` ou `:80` em LISTEN

### 3️⃣ **Verificar se há arquivos da aplicação**

```bash
ls -la
ls -la server/
ls -la dist/
```

### 4️⃣ **Tentar iniciar manualmente**

```bash
# Opção 1: Servidor direto
node server/index.js

# Opção 2: Via npm
npm start

# Opção 3: Production
npm run start:production
```

### 5️⃣ **Se nada funcionar, criar servidor temporário**

```bash
# Criar servidor básico
cat > temp-server.js << 'EOF'
const http = require('http');
const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('TEMP SERVER OK - PORT ' + port);
});

server.listen(port, '0.0.0.0', () => {
  console.log('Temp server rodando na porta ' + port);
});
EOF

# Rodar servidor temporário
node temp-server.js &
```

### 6️⃣ **Testar novamente**

```bash
curl http://localhost:3000
```

**Deve retornar:** `TEMP SERVER OK - PORT 3000`

## 🎯 **POSSÍVEIS CAUSAS:**

### ❌ **App não startou corretamente**

```bash
# Verificar logs de startup
npm run build
npm start
```

### ❌ **Porta errada configurada**

```bash
# Verificar variáveis de ambiente
env | grep PORT
echo $PORT
```

### ❌ **Dependências faltando**

```bash
# Instalar dependências
npm install
```

### ❌ **Build não foi feito**

```bash
# Fazer build
npm run build
ls -la dist/
```

## 🚀 **SOLUÇÃO DEFINITIVA:**

### **Método 1: Rebuild completo**

```bash
# Limpar tudo
rm -rf node_modules package-lock.json dist/

# Reinstalar
npm install

# Build
npm run build

# Start
npm start
```

### **Método 2: Usar servidor simples**

```bash
# Criar simple-server.js
cat > simple-server.js << 'EOF'
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

console.log('🚀 Starting server on port', PORT);

app.use(express.static('dist'));
app.get('/health', (req, res) => res.json({status: 'OK', port: PORT}));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist/index.html')));

app.listen(PORT, '0.0.0.0', () => {
  console.log('✅ Server running on port', PORT);
});
EOF

# Rodar
node simple-server.js
```

## 📱 **TESTE FINAL:**

```bash
# Em outro terminal (ou background)
curl http://localhost:3000/health

# Deve retornar:
# {"status":"OK","port":3000}
```

**Execute comandos na ordem e me informe o resultado!** 🔧
