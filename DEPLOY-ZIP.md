# 📦 Deploy via ZIP no EasyPanel

## 🏗️ Preparação

```bash
# 1. Build da aplicação
npm run build

# 2. Verificar arquivos gerados
ls dist/
```

## 📁 Arquivos para ZIP

Crie um ZIP com esta estrutura:

```
deploy.zip
├── dist/                    # Build completo
│   ├── spa/                # Frontend buildado
│   │   ├── index.html
│   │   └── assets/
│   └── server/             # Backend buildado
│       └── production.js
├── package.json            # Só com dependências de produção
└── node_modules/           # Opcional - deixe EasyPanel instalar
```

## 📦 Package.json Otimizado

Crie este package.json na raiz do ZIP:

```json
{
  "name": "chinelos-store",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node dist/server/production.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "mysql2": "^3.14.2",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "multer": "^2.0.2",
    "nodemailer": "^6.9.8",
    "sharp": "^0.34.3",
    "node-fetch": "^2.7.0",
    "csv-parser": "^3.2.0",
    "xlsx": "^0.18.5",
    "zod": "^3.23.8",
    "axios": "^1.10.0"
  }
}
```

## ⚙️ Configuração no EasyPanel

### **1. Criar Serviço:**
- Tipo: **Node.js**
- Upload: **ZIP file**
- Start Command: `npm start`

### **2. Variáveis de Ambiente:**
```env
NODE_ENV=production
PORT=80
DATABASE_URL=mysql://user:password@host:port/database
JWT_SECRET=your_secret_here
```

### **3. Build Commands:**
```bash
npm install --production
```

## ✅ Verificação

Após deploy, teste:
- `/` - Homepage
- `/api/ping` - Health check
- `/debug/status` - Status dos assets

## 🚨 Troubleshooting

Se der erro:
1. Verificar logs no EasyPanel
2. Confirmar estrutura do ZIP
3. Verificar variáveis de ambiente
4. Testar comando `npm start` localmente
