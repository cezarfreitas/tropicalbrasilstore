# Deploy para Desenvolvimento

Este guia descreve como fazer deploy da aplicação em ambiente de desenvolvimento.

## Arquivos Criados

### Configuração de Ambiente
- **`.env.development`** - Variáveis de ambiente para desenvolvimento
- **`docker-compose.dev.yml`** - Configuração Docker Compose para desenvolvimento
- **`Dockerfile.dev`** - Dockerfile otimizado para desenvolvimento
- **`easypanel.dev.json`** - Configuração EasyPanel para desenvolvimento

### Scripts
- **`build-dev.js`** - Script de build para desenvolvimento
- **`deploy-dev.sh`** - Script automatizado de deploy

## Como Usar

### 1. Deploy Local com Docker

```bash
# Opção 1: Script automatizado (recomendado)
npm run deploy:dev

# Opção 2: Docker Compose diretamente
npm run docker:dev

# Para parar
npm run docker:dev:down
```

### 2. Build e Start Manual

```bash
# Build para desenvolvimento
npm run build:dev

# Start da aplicação
npm run start:dev
```

### 3. Deploy no EasyPanel

1. Upload do arquivo `easypanel.dev.json`
2. Configure as variáveis de ambiente no painel
3. Deploy através da interface

## Diferenças do Ambiente de Desenvolvimento

### Características
- **Porta**: 8080 (em vez de 80)
- **Hot Reload**: Habilitado
- **Debug Mode**: Ativo
- **Compressão**: Desabilitada para debug
- **Cache**: Desabilitado para desenvolvimento

### Variáveis de Ambiente
```bash
NODE_ENV=development
PORT=8080
DEBUG_MODE=true
HOT_RELOAD=true
CORS_ORIGIN=http://localhost:8080
```

## URLs de Acesso

- **Aplicação**: http://localhost:8080
- **Health Check**: http://localhost:8080/health
- **API**: http://localhost:8080/api

## Comandos Úteis

```bash
# Ver logs dos containers
docker-compose -f docker-compose.dev.yml logs -f

# Rebuild containers
docker-compose -f docker-compose.dev.yml up --build --force-recreate

# Limpar volumes
docker-compose -f docker-compose.dev.yml down -v

# Status dos containers
docker-compose -f docker-compose.dev.yml ps
```

## Troubleshooting

### Container não inicia
```bash
# Verificar logs
docker-compose -f docker-compose.dev.yml logs

# Verificar porta em uso
netstat -tulpn | grep 8080
```

### Build falha
```bash
# Limpar cache do npm
npm cache clean --force

# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install
```

### Health check falha
```bash
# Teste manual
curl http://localhost:8080/health

# Verificar se a aplicação está rodando
docker-compose -f docker-compose.dev.yml ps
```

## Estrutura de Deploy

1. **Build** da aplicação com `build-dev.js`
2. **Container** criado com `Dockerfile.dev`
3. **Orquestração** via `docker-compose.dev.yml`
4. **Health Check** automático
5. **Volumes** para persistir uploads

## Próximos Passos

Após confirmar que o desenvolvimento está funcionando:
1. Testar todas as funcionalidades
2. Verificar logs para erros
3. Fazer ajustes se necessário
4. Preparar para deploy de produção
