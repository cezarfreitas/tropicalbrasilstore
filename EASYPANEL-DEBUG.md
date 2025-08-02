# 🚨 EasyPanel Debugging - Service Not Started

## ❌ Problema Atual:
Service mostrando "Service is not started" no EasyPanel

## 🔍 Possíveis Causas:

### 1. **Variáveis de Ambiente**
O container precisa das variáveis de ambiente no EasyPanel:

```bash
NODE_ENV=production
DATABASE_URL=mysql://user:password@host:port/database
# OU
MYSQL_HOST=your_host
MYSQL_USER=your_user
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=your_database
PORT=3000
```

### 2. **Container não consegue conectar ao banco**
- Verificar se o banco de dados está acessível
- Testar conectividade de rede
- Verificar credenciais

### 3. **Porta incorreta**
- EasyPanel pode estar esperando porta diferente
- Verificar configuração de rede do projeto

## ✅ Correções Aplicadas:

### 1. **Startup Logging melhorado**
```typescript
// Bind to 0.0.0.0 (container-friendly)
app.listen(port, "0.0.0.0", () => {
  console.log(`✅ Server running on http://0.0.0.0:${port}`);
});
```

### 2. **Error Handling**
```typescript
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});
```

### 3. **Dependency Check**
```bash
npm run check  # Verifica se tudo está instalado
npm run start:safe  # Start com verificação
```

### 4. **Dockerfile atualizado**
```dockerfile
CMD ["npm", "run", "start:safe"]
```

## 🚀 Próximos Passos no EasyPanel:

### 1. **Verificar Logs**
No painel do EasyPanel:
- Ir em "Logs" do container
- Verificar mensagens de erro
- Procurar por "❌" ou erros

### 2. **Verificar Variáveis**
No painel do EasyPanel:
- Ir em "Environment Variables"
- Adicionar as variáveis necessárias
- Reiniciar o container

### 3. **Configurar Rede**
- Verificar se porta 3000 está exposta
- Verificar se domain/proxy está configurado

### 4. **Database Connection**
- Se usando banco externo, verificar conectividade
- Se usando banco interno, verificar se está rodando
- Testar credenciais

## 🔧 Comandos para Debug:

```bash
# Dentro do container (se possível acessar)
npm run check
node server/check-deps.js
npm run start:safe
```

## 📋 Checklist:

- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados acessível
- [ ] Porta 3000 exposta
- [ ] Domain/proxy configurado
- [ ] Logs verificados
- [ ] Container reiniciado após mudanças

## 🎯 Resultado Esperado:
Depois das correções, o serviço deve mostrar a loja funcionando normalmente como no Fly.io
