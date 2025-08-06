# 🚀 Guia de Separação Frontend/Backend

## 📋 Visão Geral

Este guia documenta como separar a aplicação monolítica atual em duas aplicações independentes:

- **Frontend**: Aplicação React/TypeScript (SPA)
- **Backend**: API REST Node.js/Express

## 🏗️ Nova Estrutura

```
project-root/
├── frontend/                 # Aplicação React independente
│   ├── src/
│   │   ├── components/       # Componentes React
│   │   ├── pages/           # Páginas da aplicação
│   │   ├── hooks/           # React hooks customizados
│   │   ├── lib/             # Utilitários
│   │   ├── config/          # Configurações (API, etc.)
│   │   └── types/           # Tipos TypeScript
│   ├── public/              # Assets estáticos
│   ├── package.json         # Dependências do frontend
│   └── vite.config.ts       # Configuração Vite
���
├── backend/                  # API REST independente
│   ├── src/
│   │   ├── routes/          # Rotas da API
│   │   ├── lib/             # Utilitários e database
│   │   ├── middleware/      # Middlewares Express
│   │   └── types/           # Tipos TypeScript
│   ├── public/uploads/      # Arquivos de upload
│   ├── package.json         # Dependências do backend
│   └── vite.config.ts       # Build config para backend
│
└── docs/                    # Documentação
```

## 🔧 Configuração

### Frontend (porta 3000)

```bash
cd frontend
npm install
npm run dev
```

### Backend (porta 3001)

```bash
cd backend
npm install
npm run dev
```

## 🌐 Variáveis de Ambiente

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3001
VITE_API_KEY=your_api_key_here
```

### Backend (.env)

```env
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
DATABASE_URL=mysql://user:pass@host:port/db
JWT_SECRET=your_jwt_secret
```

## 🔄 Processo de Migração

### 1. Executar Script de Migração

```bash
chmod +x migrate-to-separate.sh
./migrate-to-separate.sh
```

### 2. Ajustar Imports do Frontend

Alterar todos os imports para usar os novos paths:

```typescript
// Antes
import { Button } from "@/components/ui/button";

// Depois (ainda funciona com @ configurado)
import { Button } from "@/components/ui/button";
```

### 3. Configurar API Client

O frontend agora usa um cliente HTTP centralizado:

```typescript
import { api } from "@/lib/api-client";

// GET request
const products = await api.get("/api/products");

// POST request
const result = await api.post("/api/products", productData);
```

### 4. Atualizar Rotas do Backend

Importar todas as rotas existentes no novo `backend/src/index.ts`:

```typescript
import { productsRouter } from "./routes/products";
import { settingsRouter } from "./routes/settings";
// ... outras rotas

app.use("/api/products", productsRouter);
app.use("/api/settings", settingsRouter);
```

## 📦 Deploy Separado

### Frontend (Netlify/Vercel/etc.)

```bash
cd frontend
npm run build
# Deploy pasta dist/ para hosting estático
```

### Backend (Railway/Heroku/VPS)

```bash
cd backend
npm run build
npm start
# Deploy como aplicação Node.js
```

## ✅ Vantagens da Separação

1. **Deploy Independente**: Frontend e backend podem ser deployados separadamente
2. **Escalabilidade**: Cada parte pode ser escalada independentemente
3. **Manutenção**: Código mais organizado e fácil de manter
4. **Flexibilidade**: Possibilidade de ter múltiplos frontends (mobile, web, admin)
5. **Performance**: Frontend estático + CDN para melhor performance
6. **Tecnologia**: Liberdade para usar diferentes tecnologias em cada parte

## 🔍 Pontos de Atenção

1. **CORS**: Configurar corretamente no backend
2. **Autenticação**: Tokens JWT entre frontend/backend
3. **Upload de Arquivos**: Backend serve os uploads
4. **Environment Variables**: Separar configurações
5. **Error Handling**: Tratamento de erros de rede
6. **Deployment**: URLs diferentes em produção

## 🚦 Próximos Passos

1. ✅ Estrutura de arquivos criada
2. ⏳ Migrar componentes React
3. ⏳ Migrar rotas da API
4. ⏳ Configurar autenticação
5. ⏳ Testar em desenvolvimento
6. ⏳ Configurar deploys
7. ⏳ Documentar APIs
8. ⏳ Testes end-to-end

## 📞 Suporte

Para dúvidas sobre a migração:

1. Consulte a documentação dos componentes
2. Verifique os logs do console para erros
3. Teste as rotas da API individualmente
4. Valide as configurações de CORS
