# Chinelos Store - Sistema B2B

Sistema de e-commerce B2B para venda de chinelos com funcionalidades completas.

## 🚀 Desenvolvimento

```bash
# Instalar dependências
npm install

# Desenvolvimento (hot reload)
npm run dev

# Build completo
npm run build

# Produção
npm start
```

## 📁 Estrutura

```
├── client/          # Frontend React + TypeScript
├── server/          # Backend Node.js + Express  
├── shared/          # Tipos compartilhados
├── public/          # Assets públicos
└── dist/            # Build de produção
```

## ⚙️ Scripts

- `npm run dev` - Desenvolvimento na porta 8080
- `npm run build` - Build completo (client + server)
- `npm start` - Executar produção
- `npm run typecheck` - Verificar tipos

## 🔧 Configuração

Arquivo `.env`:
```env
NODE_ENV=development
PORT=8080
DATABASE_URL=mysql://user:pass@host:port/db
JWT_SECRET=sua_chave_secreta
```

## 🌐 URLs

- **Desenvolvimento**: http://localhost:8080
- **Health Check**: http://localhost:8080/health
- **API**: http://localhost:8080/api

## 📦 Stack

- **Frontend**: React, TypeScript, Vite, TailwindCSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: MySQL
- **Build**: Vite + SWC

## 🎯 Funcionalidades

- Sistema B2B completo
- API bulk produto/variantes
- Galeria de imagens
- Sistema de grades
- Carrinho e checkout
- Autenticação
- Painel administrativo
