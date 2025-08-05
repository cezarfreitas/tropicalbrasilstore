# Chinelos Store - Sistema B2B

## 🚀 Início Rápido

```bash
# 1. Instalar dependências
npm install

# 2. Fazer build
npm run build

# 3. Executar
npm start
```

## 📁 Estrutura

```
├── client/          # Frontend React + TypeScript
├── server/          # Backend Node.js + Express
├── shared/          # Tipos e utilitários compartilhados
├── public/          # Assets públicos
├── dist/            # Build de produção
└── package.json     # Configuração do projeto
```

## ⚙️ Scripts

- `npm start` - Executa aplicação em produção
- `npm run dev` - Executa em desenvolvimento
- `npm run build` - Build completo (client + server)
- `npm run build:client` - Build apenas frontend
- `npm run build:server` - Build apenas backend

## 🌐 Acesso

- **Aplicação**: http://localhost (porta via env PORT)
- **Health Check**: `/health`
- **API**: `/api/*`

## 🔧 Configuração

Configure no arquivo `.env`:

```env
NODE_ENV=production
PORT=80
DATABASE_URL=mysql://user:pass@host:port/db
JWT_SECRET=sua_chave_secreta
CORS_ORIGIN=https://seu-dominio.com
```

## 📦 Funcionalidades

- ✅ Sistema B2B completo
- ✅ API bulk com formato produto/variantes
- ✅ Galeria de imagens por produto
- ✅ Sistema de grades (tamanhos/cores)
- ✅ Carrinho e checkout
- ✅ Autenticação e autorização
- ✅ Painel administrativo
- ✅ Interface de loja

## 🏗️ Tecnologias

- **Frontend**: React, TypeScript, Vite, TailwindCSS
- **Backend**: Node.js, Express, TypeScript
- **Banco**: MySQL
- **Build**: Vite + TypeScript

## 📄 Licença

Proprietary - Todos os direitos reservados
