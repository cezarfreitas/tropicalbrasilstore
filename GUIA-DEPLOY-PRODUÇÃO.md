# 🚀 Guia Completo de Deploy - API produto/variantes

## 📋 Pré-requisitos

- Docker instalado
- Acesso ao servidor de produção
- Banco de dados MySQL configurado

## 🔧 Arquivos de Deploy Criados

1. **`Dockerfile`** - Dockerfile principal otimizado
2. **`Dockerfile.production`** - Dockerfile multi-stage para produção
3. **`docker-compose.prod.yml`** - Configuração para produção
4. **`build-production.sh`** - Script automatizado de build
5. **`deploy-production.sh`** - Script automatizado de deploy

## 🚀 Deploy Automático (Recomendado)

### 1. Build Local

```bash
# Dar permissão aos scripts
chmod +x build-production.sh deploy-production.sh

# Executar build
./build-production.sh
```

### 2. Deploy no Servidor

```bash
# Configurar variáveis (ajuste conforme seu servidor)
export REMOTE_HOST="b2b.tropicalbrasilsandalias.com.br"
export REMOTE_USER="root"
export APP_PATH="/opt/chinelos-store"

# Executar deploy
./deploy-production.sh
```

## 🔨 Deploy Manual

### 1. Build da Imagem

```bash
# Build
docker build -t chinelos-api:latest .

# Verificar
docker images | grep chinelos-api
```

### 2. Testar Localmente

```bash
# Subir com docker-compose
docker-compose -f docker-compose.prod.yml up -d

# Testar health check
curl http://localhost:80/health

# Testar API
curl -X POST http://localhost:80/api/products/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "produto": {
      "codigo": "TEST001",
      "nome": "Teste Deploy"
    },
    "variantes": [
      {
        "cor": "Test",
        "preco": 10.00,
        "grades": {"P": 1}
      }
    ]
  }'
```

### 3. Enviar para Produção

#### Opção A: Com Registry Docker

```bash
# Tag para registry
docker tag chinelos-api:latest seu-registry.com/chinelos-api:latest

# Push
docker push seu-registry.com/chinelos-api:latest

# No servidor
docker pull seu-registry.com/chinelos-api:latest
docker-compose -f docker-compose.prod.yml up -d
```

#### Opção B: Transfer Direto

```bash
# Salvar imagem
docker save chinelos-api:latest > chinelos-api.tar

# Enviar para servidor
scp chinelos-api.tar docker-compose.prod.yml user@servidor:/opt/chinelos/

# No servidor
docker load < chinelos-api.tar
docker-compose -f docker-compose.prod.yml up -d
```

## 🔍 Verificação Pós-Deploy

### 1. Health Check

```bash
curl http://seu-servidor.com/health
```

### 2. Testar API produto/variantes

```bash
curl -X POST https://b2b.tropicalbrasilsandalias.com.br/api/products/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "produto": {
      "codigo": "CHN001",
      "nome": "Chinelo Havaianas Top",
      "categoria": "Chinelos",
      "tipo": "Casual",
      "marca": "Havaianas",
      "genero": "Unissex",
      "descricao": "O chinelo mais famoso do Brasil",
      "preco_sugerido": 39.90,
      "vender_infinito": false,
      "tipo_estoque": "grade"
    },
    "variantes": [
      {
        "cor": "Preto",
        "preco": 29.90,
        "foto": "https://exemplo.com/chinelo-preto.jpg",
        "grades": {
          "Infantil": 15,
          "Adulto": 25
        }
      }
    ]
  }'
```

### 3. Verificar Logs

```bash
# Ver logs
docker-compose -f docker-compose.prod.yml logs -f

# Status dos containers
docker-compose -f docker-compose.prod.yml ps
```

## 🔧 Comandos Úteis

### Restart do Serviço

```bash
docker-compose -f docker-compose.prod.yml restart
```

### Update da Aplicação

```bash
# Re-build e deploy
./build-production.sh
./deploy-production.sh
```

### Backup de Uploads

```bash
# Backup
tar -czf uploads-backup.tar.gz public/uploads/

# Restore
tar -xzf uploads-backup.tar.gz
```

### Monitoramento

```bash
# CPU/Memory usage
docker stats

# Logs em tempo real
docker-compose -f docker-compose.prod.yml logs -f chinelos-api

# Processos
docker-compose -f docker-compose.prod.yml top
```

## 🚨 Troubleshooting

### Container não inicia

```bash
# Ver logs detalhados
docker-compose -f docker-compose.prod.yml logs chinelos-api

# Verificar configuração
docker-compose -f docker-compose.prod.yml config
```

### API não responde

```bash
# Verificar se porta está aberta
netstat -tlnp | grep :80

# Testar interno do container
docker exec -it chinelos-api-prod curl localhost:80/health
```

### Erro de banco de dados

```bash
# Verificar variáveis de ambiente
docker exec chinelos-api-prod env | grep DATABASE

# Testar conexão
docker exec chinelos-api-prod node -e "console.log(process.env.DATABASE_URL)"
```

## ✅ Checklist Final

- [ ] Build executado sem erros
- [ ] Imagem Docker criada
- [ ] Container inicia corretamente
- [ ] Health check retorna 200
- [ ] API produto/variantes responde
- [ ] N8n consegue usar novo formato
- [ ] Uploads funcionando
- [ ] Logs mostram "Using new produto/variantes format"

## 🎯 Resultado Esperado

Após o deploy, a API em `https://b2b.tropicalbrasilsandalias.com.br/api/products/bulk` deve:

1. ✅ Aceitar formato `{produto: {...}, variantes: [...]}`
2. ✅ Mostrar logs: "Using new produto/variantes format"
3. ✅ Processar produtos corretamente
4. ✅ Funcionar com N8n sem o erro "Missing products field"
