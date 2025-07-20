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
NODE_ENV=production
PORT=3000
```

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
