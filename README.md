# Chinelos Store - Sistema B2B

Sistema de e-commerce B2B para venda de chinelos com funcionalidades completas de catálogo, carrinho e administração.

## 🚀 Desenvolvimento

```bash
# Instalar dependências
npm install

# Desenvolvimento
npm run dev

# Build
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

- `npm run dev` - Desenvolvimento com hot reload
- `npm run build` - Build completo
- `npm start` - Executar produção
- `npm run build:client` - Build frontend
- `npm run build:server` - Build backend

## 🔧 Configuração

Arquivo `.env`:

```env
NODE_ENV=development
PORT=8080
DATABASE_URL=mysql://user:pass@host:port/db
JWT_SECRET=sua_chave_secreta
```

## 🌐 URLs

- **App**: http://localhost:8080
- **Health**: http://localhost:8080/health
- **API**: http://localhost:8080/api

## 📦 Stack

- **Frontend**: React, TypeScript, Vite, TailwindCSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: MySQL
- **Build**: Vite

## 🎯 Funcionalidades

- Sistema B2B completo
- API bulk produto/variantes
- Galeria de imagens
- Sistema de grades
- Carrinho e checkout
- Autenticação
- Painel admin
