# 🩴 Chinelos Store - Sistema Completo de E-commerce

Sistema completo de e-commerce para loja de chinelos com admin, gestão de produtos, pedidos e clientes.

## 🚀 Tecnologias

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Banco de Dados**: MySQL 8.0
- **UI Components**: Radix UI + shadcn/ui
- **Deploy**: Docker + Docker Compose

## ✨ Funcionalidades

### 🛍️ Loja (Frontend)

- Catálogo de produtos com filtros e paginação
- Sistema de variantes (tamanhos e cores)
- Carrinho de compras
- Checkout simplificado
- Layout responsivo

### 👨‍💼 Admin (Backoffice)

- **Dashboard** com estatísticas
- **Gestão de Produtos** com variantes e grades
- **Gestão de Pedidos** com status e acompanhamento
- **Gestão de Clientes** com histórico
- **Configurações da Loja**
- **Categorias, Tamanhos, Cores**
- **Sistema de Grades** para vendas em lote

### 🔧 Sistema Técnico

- API REST completa
- Paginação e filtros avançados
- Upload de imagens
- Seed de dados automático
- Sistema de grades complexo

## 🏃‍♂️ Quick Start

### 1. Clone o Repositório

```bash
git clone [URL_DO_REPOSITORIO]
cd chinelos-store
```

### 2. Configurar Ambiente

```bash
# Copiar arquivo de ambiente
cp .env.example .env

# Editar variáveis (ajustar senhas)
nano .env
```

### 3. Deploy com Docker

```bash
# Build e iniciar
docker-compose up -d

# Verificar status
docker-compose ps
```

### 4. Acessar Sistema

- **Loja**: http://localhost:3000
- **Admin**: http://localhost:3000/admin
- **API**: http://localhost:3000/api

## 📁 Estrutura do Projeto

```
chinelos-store/
├── client/                 # Frontend React
│   ├── components/         # Componentes UI
│   ├── pages/             # Páginas da aplicação
│   ├── hooks/             # Custom hooks
│   └── lib/               # Utilitários
├── server/                # Backend Express
│   ├── routes/            # Rotas da API
│   ├── lib/               # Biblioteca e DB
│   └── index.ts           # Servidor principal
��── shared/                # Tipos compartilhados
├── docker-compose.yml     # Orquestração
├── Dockerfile            # Imagem da aplicação
└── DEPLOY.md             # Guia de deploy
```

## 🛠️ Desenvolvimento Local

### Pré-requisitos

- Node.js 18+
- MySQL 8.0
- npm ou yarn

### Instalação

```bash
# Instalar dependências
npm install

# Configurar banco de dados local
# Ajustar connection string em server/lib/db.ts

# Iniciar desenvolvimento
npm run dev
```

### Scripts Disponíveis

```bash
npm run dev          # Desenvolvimento
npm run build        # Build produção
npm run start        # Iniciar produção
npm run typecheck    # Verificar tipos
```

## 🗄️ Banco de Dados

### Tabelas Principais

- `products` - Produtos
- `product_variants` - Variantes (tamanho/cor)
- `categories` - Categorias
- `sizes` - Tamanhos
- `colors` - Cores
- `orders` - Pedidos
- `order_items` - Itens do pedido
- `customers` - Clientes
- `grade_vendida` - Grades para venda
- `store_settings` - Configurações

### Seed Automático

O sistema inicializa automaticamente com:

- 100 produtos de exemplo
- Categorias, tamanhos e cores
- Grades pré-configuradas
- Configurações padrão da loja

## 🚀 Deploy em Produção

Veja o arquivo [DEPLOY.md](DEPLOY.md) para instruções completas de deploy no Easy Panel.

### Deploy Rápido

```bash
# Fazer build
docker-compose build

# Iniciar em produção
docker-compose up -d

# Verificar
docker-compose logs -f app
```

## 📊 Monitoramento

### Logs

```bash
# Logs da aplicação
docker-compose logs -f app

# Logs do banco
docker-compose logs -f db
```

### Health Checks

- App: `http://localhost:3000/api/ping`
- Database: Interno via Docker health check

## 🔒 Segurança

- Senhas do banco configuráveis via ambiente
- Validação de dados com Zod
- Headers de segurança
- SQL injection protegido (prepared statements)

## 🆘 Troubleshooting

### Problema: Erro de conexão com banco

```bash
# Verificar se o banco está rodando
docker-compose ps db

# Reiniciar banco
docker-compose restart db
```

### Problema: Porta em uso

```bash
# Verificar processo na porta
lsof -i :3000

# Alterar porta no docker-compose.yml
```

### Problema: Build falha

```bash
# Limpar cache e rebuildar
docker-compose build --no-cache
```

## 👥 Contribuição

1. Fork o projeto
2. Crie sua feature branch
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto é propriedade privada. Todos os direitos reservados.

---

**Desenvolvido com ❤️ para a melhor experiência em e-commerce de chinelos!**
