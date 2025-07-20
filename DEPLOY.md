<<<<<<< HEAD
# 🚀 Deploy da Chinelos Store no Easy Panel

## 📋 Pré-requisitos

1. **Conta no Easy Panel** com Docker habilitado
2. **Git** instalado no servidor
3. **Domain/Subdomain** configurado (opcional)

## 🔧 Configuração no Easy Panel

### 1. Criar Novo Projeto

1. Acesse seu painel do Easy Panel
2. Clique em **"New Project"**
3. Escolha **"Docker Compose"**
4. Nome do projeto: `chinelos-store`

### 2. Configurar Repositório

1. **Repository URL**: `[URL do seu repositório]`
2. **Branch**: `main`
3. **Build Path**: `/`
4. **Compose File**: `docker-compose.yml`

### 3. Variáveis de Ambiente

Configure as seguintes variáveis no Easy Panel:

```env
# Database Configuration
DB_HOST=db
DB_PORT=3306
DB_NAME=chinelos_store
DB_USER=chinelos_user
DB_PASSWORD=SUA_SENHA_SEGURA_AQUI
DB_ROOT_PASSWORD=SUA_SENHA_ROOT_AQUI

# Application Configuration
=======
# 🚀 Deploy Guide - Chinelos Admin

Este projeto está configurado para deploy com **Nixpacks**, compatível com plataformas como Railway, Render, Fly.io e outras.

## 📋 Pré-requisitos

- Node.js 22+
- MySQL Database
- Plataforma compatível com Nixpacks

## 🔧 Configuração de Ambiente

### Variáveis de Ambiente Obrigatórias

```bash
# Database - Use uma dessas opções:

# Opção 1: URL completa do banco
DATABASE_URL=mysql://user:password@host:port/database

# Opção 2: Variáveis individuais
MYSQL_HOST=your-mysql-host
MYSQL_USER=your-username
MYSQL_PASSWORD=your-password
MYSQL_DATABASE=your-database-name
MYSQL_PORT=3306

# Configuração do servidor
>>>>>>> c72c1b6292519beaaf381a21765f20e08bcdca45
NODE_ENV=production
PORT=3000
```

<<<<<<< HEAD
### 4. Deploy

1. Clique em **"Deploy"**
2. Aguarde o build terminar
3. Configure o domínio (se necessário)

## 🌐 Configuração de Domínio

### No Easy Panel:

1. Vá para **"Domains"**
2. Adicione seu domínio
3. Configure o proxy para porta `3000`

### DNS (se usando domínio próprio):

```
A    chinelos.seudominio.com    [IP_DO_SERVIDOR]
```

## 📊 Monitoramento

### Logs da Aplicação

```bash
docker-compose logs -f app
```

### Logs do Banco

```bash
docker-compose logs -f db
```

### Status dos Containers

```bash
docker-compose ps
```

## 🔄 Comandos Úteis

### Reiniciar Aplicação

```bash
docker-compose restart app
```

### Reiniciar Banco

```bash
docker-compose restart db
```

### Parar Tudo

```bash
docker-compose down
```

### Iniciar Novamente

```bash
docker-compose up -d
```

### Rebuild da Aplicação

```bash
docker-compose build --no-cache app
docker-compose up -d app
```

## 🗄️ Backup do Banco de Dados

### Criar Backup

```bash
docker-compose exec db mysqldump -u root -p chinelos_store > backup.sql
```

### Restaurar Backup

```bash
docker-compose exec -i db mysql -u root -p chinelos_store < backup.sql
```

## 🔒 Segurança

1. **Altere as senhas padrão** nas variáveis de ambiente
2. **Configure SSL/HTTPS** através do Easy Panel
3. **Mantenha backups regulares** do banco de dados
4. **Monitore os logs** regularmente

## 📱 Acesso ao Sistema

Após o deploy:

- **Loja (Frontend)**: `https://seudominio.com/`
- **Admin**: `https://seudominio.com/admin`
- **API**: `https://seudominio.com/api`

### Usuários Padrão:

- **Admin**: Acesso livre (sem autenticação implementada)

## 🆘 Troubleshooting

### Problema: Container não inicia

```bash
# Verificar logs
docker-compose logs app

# Verificar variáveis de ambiente
docker-compose config
```

### Problema: Erro de conexão com banco

```bash
# Verificar se o banco está rodando
docker-compose ps db

# Verificar logs do banco
docker-compose logs db

# Testar conexão
docker-compose exec app ping db
```

### Problema: Porta já em uso

```bash
# Verificar o que está usando a porta
netstat -tulpn | grep :3000

# Alterar porta no docker-compose.yml se necessário
```

## 📞 Suporte

Em caso de problemas:

1. Verifique os logs da aplicação
2. Confirme as variáveis de ambiente
3. Teste a conectividade do banco
4. Verifique a configuração de domínio

---

✅ **Deploy concluído com sucesso!**

Sua loja de chinelos está agora rodando no Easy Panel! 🩴
=======
### Variáveis Opcionais

```bash
DB_CONNECTION_LIMIT=10
APP_NAME="Chinelos Admin"
APP_VERSION="1.0.0"
```

## 🏗�� Estrutura de Build

O projeto usa **Vite** para build otimizado:

- **Frontend**: React + TypeScript → `dist/spa/`
- **Backend**: Express + TypeScript → `dist/server/`
- **Static Files**: Servidos automaticamente pelo Express

## 📦 Deploy com Nixpacks

### Railway

```bash
railway login
railway new
railway add
railway up
```

### Render

1. Conecte seu repositório Git
2. Configure as variáveis de ambiente
3. Deploy automático no push

### Fly.io

```bash
fly auth login
fly launch
fly deploy
```

### Docker (Alternativa)

```bash
docker build -t chinelos-admin .
docker run -p 3000:3000 --env-file .env chinelos-admin
```

## 🏃‍♂️ Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Start produção local
npm start

# Testes
npm test

# Type checking
npm run typecheck
```

## 📁 Arquivos de Configuração

- `nixpacks.toml` - Configuração do Nixpacks
- `Dockerfile` - Backup para deploy Docker
- `.env.example` - Template de variáveis de ambiente
- `deploy.sh` - Script de verificação pré-deploy

## 🔍 Health Check

O aplicativo inclui endpoint de health check:

```
GET /health
```

Resposta:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "version": "1.0.0",
  "environment": "production"
}
```

## 🗄️ Database Setup

O banco de dados é inicializado automaticamente na primeira execução com:

- Tabelas necessárias
- Dados de exemplo (categorias, cores, tamanhos)
- Estrutura completa do sistema

## 📊 Monitoramento

- **Health Check**: `/health`
- **API Status**: `/api/ping`
- **Logs**: Estruturados para análise
- **Error Handling**: Respostas consistentes

## 🔧 Troubleshooting

### Erro de Conexão com Database

- Verifique as variáveis `DATABASE_URL` ou `MYSQL_*`
- Confirme que o banco está acessível
- Teste conectividade de rede

### Build Failures

- Execute `npm run typecheck` localmente
- Verifique dependências com `npm ci`
- Confirme versão do Node.js (22+)

### Performance Issues

- Ajuste `DB_CONNECTION_LIMIT`
- Monitor logs de conexão
- Considere uso de CDN para assets

## 🎯 Próximos Passos

Após deploy:

1. ✅ Configurar domínio personalizado
2. ✅ Configurar SSL/HTTPS
3. ✅ Configurar backup do banco
4. ✅ Monitoramento e alertas
5. ✅ CI/CD pipeline

---

**Projeto pronto para produção!** 🎉
>>>>>>> c72c1b6292519beaaf381a21765f20e08bcdca45
