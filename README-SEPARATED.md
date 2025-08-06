# 🏪 Chinelos Store - Frontend/Backend Separado

Sistema B2B para venda de chinelos com arquitetura separada entre frontend e backend.

## 🏗️ Arquitetura

```
┌─────────────────┐    HTTP/API    ┌─────────────────┐
│   Frontend      │ ────────────── │    Backend      │
│   React SPA     │                │   Express API   │
│   Port: 3000    │                │   Port: 3001    │
└─────────────────┘                └─────────────────┘
                                           │
                                           │ MySQL
                                           ▼
                                   ┌─────────────────��
                                   │    Database     │
                                   │   MySQL 8.0     │
                                   │   Port: 3306    │
                                   └─────────────────┘
```

## 🚀 Quick Start

### 1. Migração da Estrutura Atual

```bash
# Executar script de migração
chmod +x migrate-to-separate.sh
./migrate-to-separate.sh
```

### 2. Desenvolvimento

#### Frontend (React)

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
# Acesse: http://localhost:3000
```

#### Backend (API)

```bash
cd backend
cp .env.example .env
npm install
npm run dev
# API: http://localhost:3001
# Health: http://localhost:3001/health
```

### 3. Produção com Docker

```bash
# Build e start todos os serviços
docker-compose -f docker-compose.separated.yml up -d

# Verificar status
docker-compose -f docker-compose.separated.yml ps

# Ver logs
docker-compose -f docker-compose.separated.yml logs -f
```

## 📁 Estrutura do Projeto

```
chinelos-store/
├── frontend/                    # Aplicação React (SPA)
│   ├── src/
│   │   ├── components/          # Componentes React
│   │   ├── pages/              # Páginas da aplicação
│   │   ��── hooks/              # Custom hooks
│   │   ├── lib/                # Utilitários
│   │   ├── config/             # Configurações
│   │   └── types/              # Tipos TypeScript
│   ├── public/                 # Assets estáticos
│   ├── package.json
│   ├── vite.config.ts
│   ├── Dockerfile
│   └── nginx.conf
│
├── backend/                     # API REST
│   ├── src/
│   │   ├── routes/             # Rotas da API
│   │   ├── lib/                # Database e utilitários
│   │   ├── middleware/         # Middlewares
│   │   └── types/              # Tipos TypeScript
│   ├── public/uploads/         # Arquivos de upload
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
│
├── docs/                       # Documentação
├── docker-compose.separated.yml
├── migrate-to-separate.sh
└── SEPARATION-GUIDE.md
```

## ⚙️ Configuração

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3001
VITE_API_KEY=your_api_key
VITE_APP_NAME="Chinelos Store"
```

### Backend (.env)

```env
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
DATABASE_URL=mysql://user:pass@localhost:3306/chinelos
JWT_SECRET=your_super_secret_key
```

## 📦 Scripts Disponíveis

### Frontend

```bash
npm run dev        # Desenvolvimento
npm run build      # Build para produção
npm run preview    # Preview do build
npm run typecheck  # Verificar tipos
```

### Backend

```bash
npm run dev        # Desenvolvimento com hot reload
npm run build      # Build para produção
npm start          # Executar produção
npm run typecheck  # Verificar tipos
```

## 🌐 URLs

| Serviço      | Desenvolvimento              | Produção                           |
| ------------ | ---------------------------- | ---------------------------------- |
| Frontend     | http://localhost:3000        | https://your-frontend-domain.com   |
| Backend API  | http://localhost:3001        | https://your-api-domain.com        |
| Health Check | http://localhost:3001/health | https://your-api-domain.com/health |

## 🔗 Integração Frontend/Backend

### Cliente HTTP (Frontend)

```typescript
import { api } from "@/lib/api-client";

// GET request
const products = await api.get("/api/products");

// POST request
const result = await api.post("/api/products", {
  nome: "Chinelo Novo",
  preco: 29.99,
});

// Error handling
try {
  const data = await api.get("/api/settings");
} catch (error) {
  if (error instanceof ApiClientError) {
    console.error("API Error:", error.message, error.status);
  }
}
```

### CORS (Backend)

```typescript
// Configuração automática no backend
app.use(
  cors({
    origin: [
      "http://localhost:3000", // Development
      "https://your-domain.com", // Production
    ],
    credentials: true,
  }),
);
```

## 🚀 Deploy

### Frontend (Netlify/Vercel)

```bash
cd frontend
npm run build
# Deploy pasta dist/ para hosting estático
```

### Backend (Railway/Heroku)

```bash
cd backend
npm run build
# Deploy como aplicação Node.js
```

### Docker (Produção)

```bash
# Build images
docker-compose -f docker-compose.separated.yml build

# Deploy
docker-compose -f docker-compose.separated.yml up -d
```

## 🔧 Desenvolvimento

### Adicionar Nova Página (Frontend)

1. Criar componente em `frontend/src/pages/`
2. Adicionar rota em `frontend/src/App.tsx`
3. Importar hooks necessários

### Adicionar Nova API (Backend)

1. Criar rota em `backend/src/routes/`
2. Importar e usar em `backend/src/index.ts`
3. Documentar endpoint

### Adicionar Novo Componente UI

1. Criar em `frontend/src/components/`
2. Usar Radix UI + TailwindCSS
3. Exportar do index

## 📋 TODO - Migração

- [ ] Migrar todos os componentes React
- [ ] Migrar todas as rotas da API
- [ ] Configurar autenticação JWT
- [ ] Migrar uploads de arquivos
- [ ] Configurar variáveis de ambiente
- [ ] Documentar APIs com Swagger
- [ ] Configurar CI/CD
- [ ] Testes automatizados
- [ ] Monitoramento e logs

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.
