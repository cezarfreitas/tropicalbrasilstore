# 🚀 Instruções de Deploy para Produção

## ✅ Arquivos Preparados para Deploy

### 1. **Build Concluído**
- ✅ Cliente buildado em `dist/spa/`
- ✅ Servidor buildado em `dist/server/`
- ✅ Assets otimizados e minificados

### 2. **Configurações de Produção**
- ✅ `Dockerfile` otimizado para produção
- ✅ `easypanel.json` configurado para produção
- ✅ `.env.production` com variáveis de ambiente
- ✅ `docker-compose.prod.yml` disponível

### 3. **Funcionalidades Implementadas**
- ✅ API bulk com formato `produto/variantes`
- ✅ Galeria de imagens na página de produto
- ✅ Cards otimizados para fotos quadradas
- ✅ SKU exibido na página de produto
- ✅ Interface compacta e responsiva

## 🔧 Deploy no EasyPanel

### Opção 1: Deploy via Git (Recomendado)
1. **Fazer push das mudanças para o repositório**
2. **No EasyPanel:**
   - Criar novo projeto
   - Conectar ao repositório GitHub
   - Usar arquivo `easypanel.json`
   - Configurar variáveis de ambiente

### Opção 2: Deploy via Docker Build
```bash
# Build da imagem
docker build -t chinelos-store:latest .

# Tag para registry
docker tag chinelos-store:latest seu-registry/chinelos-store:latest

# Push para registry
docker push seu-registry/chinelos-store:latest
```

## 🔑 Variáveis de Ambiente Necessárias

```env
NODE_ENV=production
PORT=80
DATABASE_URL=mysql://user:password@host:port/database
```

## 📋 Checklist de Deploy

### Pré-Deploy
- [x] Build executado com sucesso
- [x] Testes passando
- [x] Configurações de produção validadas
- [x] Dockerfile otimizado
- [x] Variables de ambiente configuradas

### Pós-Deploy
- [ ] Health check funcionando
- [ ] API `/health` retornando 200
- [ ] API bulk funcionando com novo formato
- [ ] Imagens carregando corretamente
- [ ] SKU aparecendo nas páginas de produto
- [ ] Cards otimizados exibindo corretamente

## 🧪 Testes de Produção

### 1. **Testar API Bulk**
```bash
curl -X POST https://seu-dominio.com/api/products/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "produto": {
      "codigo": "TEST001",
      "nome": "Produto Teste",
      "categoria": "Testes"
    },
    "variantes": [
      {
        "cor": "Teste",
        "preco": 10.00,
        "grades": {"P": 1}
      }
    ]
  }'
```

### 2. **Verificar Health Check**
```bash
curl https://seu-dominio.com/health
```

### 3. **Testar Interface**
- Acessar `/loja` e verificar cards
- Acessar `/loja/produto/649` e verificar galeria
- Verificar se SKU aparece nas páginas de produto

## 🐛 Troubleshooting

### Problema: Container não inicia
**Solução**: Verificar logs do container
```bash
docker logs chinelos-store-prod
```

### Problema: API não responde
**Solução**: Verificar se porta 80 está exposta
```bash
docker exec chinelos-store-prod curl localhost:80/health
```

### Problema: Imagens não carregam
**Solução**: Verificar se volume de uploads está montado corretamente

## 📞 Suporte
- Logs estão em `/app/logs/` no container
- Health check disponível em `/health`
- API docs em `/api`
