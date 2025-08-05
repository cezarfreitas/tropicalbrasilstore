# Chinelos Store - Projeto Limpo

## 🚀 Como executar a aplicação

### 1. Instalação
```bash
npm install
```

### 2. Build
```bash
npm run build
```

### 3. Execução
```bash
npm start
```

## 📁 Estrutura do Projeto

```
├── client/          # Frontend React
├── server/          # Backend Node.js
├── shared/          # Código compartilhado
├── public/          # Arquivos estáticos
├── dist/            # Build de produção
├── package.json     # Configuração NPM
└── README.md        # Este arquivo
```

## ⚙️ Scripts Disponíveis

- `npm start` - Inicia o servidor de produção
- `npm run dev` - Inicia o servidor de desenvolvimento  
- `npm run build` - Faz build completo do projeto
- `npm run build:client` - Build apenas do frontend
- `npm run build:server` - Build apenas do backend

## 🌐 URLs

- **Aplicação**: http://localhost (porta configurada via PORT)
- **Health Check**: http://localhost/health
- **API**: http://localhost/api

## 🔧 Configuração

Configure as variáveis de ambiente no arquivo `.env`:

```bash
NODE_ENV=production
PORT=80
DATABASE_URL=sua_url_do_banco
JWT_SECRET=sua_chave_secreta
```

## 📦 Funcionalidades

- ✅ **API Bulk** - Import de produtos com formato produto/variantes
- ✅ **Galeria de Imagens** - Múltiplas fotos por produto
- ✅ **Interface Admin** - Gerenciamento completo
- ✅ **Loja Virtual** - Interface para clientes
- ✅ **Sistema de Grades** - Tamanhos e cores
- ✅ **Carrinho de Compras** - Funcionalidade completa
- ✅ **Autenticação** - Sistema de login/cadastro

## 🎯 Projeto Organizado

Todos os arquivos desnecessários de deploy e testes foram removidos.
O projeto agora está limpo e com apenas o essencial para funcionamento.
