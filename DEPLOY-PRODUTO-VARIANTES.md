# 🚀 Deploy da Nova API produto/variantes

## ❌ Problema Atual

A produção (`https://b2b.tropicalbrasilsandalias.com.br/api/products/bulk`) está retornando:

```json
{
  "error": "Missing products field",
  "message": "Request body must contain a 'products' array",
  "code": "MISSING_PRODUCTS_FIELD"
}
```

Este erro **não existe no código atual**. Significa que a produção est�� com versão antiga.

## ✅ Solução: Deploy da Nova Versão

### 1. Verificar Mudanças Implementadas

As seguintes modificações foram feitas para suportar o novo formato:

**Arquivo**: `server/routes/products.ts`

- ✅ Adicionado suporte ao formato `{produto: {...}, variantes: [...]}`
- ✅ Detecção automática do formato
- ✅ Conversão para formato interno
- ✅ Validação atualizada
- ✅ Logs detalhados

### 2. Build da Aplicação

```bash
# Build completo para produção
node build-deploy.js
```

### 3. Deploy para Produção

**Para Docker/Easypanel:**

```bash
# Se usando Docker
docker build -t chinelos-api .
docker push [REGISTRY]/chinelos-api:latest

# Se usando Easypanel
# Use o painel para fazer deploy da nova versão
```

**Para servidor tradicional:**

```bash
# Upload dos arquivos
scp -r dist/ user@servidor:/path/to/app/
scp -r server/ user@servidor:/path/to/app/

# Restart do PM2 ou serviço
pm2 restart chinelos-api
# ou
systemctl restart chinelos-api
```

### 4. Verificar Deploy

```bash
# Testar endpoint
curl -X POST https://b2b.tropicalbrasilsandalias.com.br/api/products/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "produto": {
      "codigo": "TEST001",
      "nome": "Teste Deploy",
      "categoria": "Testes",
      "tipo": "Teste",
      "marca": "Test",
      "genero": "Unissex",
      "descricao": "Teste do novo formato",
      "preco_sugerido": 10.00,
      "vender_infinito": false,
      "tipo_estoque": "grade"
    },
    "variantes": [
      {
        "cor": "Test",
        "preco": 10.00,
        "foto": "https://test.com/test.jpg",
        "grades": {
          "P": 1
        }
      }
    ]
  }'
```

## 🔄 Formatos Suportados Após Deploy

1. **✅ Novo formato (seu pedido)**:

```json
{
  "produto": {...},
  "variantes": [...]
}
```

2. **✅ Array direto**:

```json
[{codigo: "...", variantes: [...]}]
```

3. **✅ Formato legacy**:

```json
{
  "products": [{codigo: "...", variantes: [...]}]
}
```

4. **✅ Produto único**:

```json
{codigo: "...", variantes: [...]}
```

## 📋 Checklist de Deploy

- [ ] Build executado sem erros
- [ ] Arquivos enviados para produção
- [ ] Serviço reiniciado
- [ ] Teste com curl funciona
- [ ] N8n consegue usar novo formato
- [ ] Logs mostram "Using new produto/variantes format"

## 🐛 Troubleshooting

**Se ainda der erro após deploy:**

1. **Verificar logs do servidor**:

```bash
# PM2
pm2 logs chinelos-api

# Docker
docker logs chinelos-container

# Systemd
journalctl -u chinelos-api -f
```

2. **Verificar se o build incluiu as mudanças**:

- Procurar por "produto && req.body.variantes" no código built

3. **Cache de proxy/CDN**:

- Limpar cache do Cloudflare/nginx se estiver usando

## 📞 Suporte

Se o deploy não resolver, pode ser:

- Problema de configuração do servidor
- Cache de proxy/CDN
- Múltiplas instâncias rodando versões diferentes
- Configuração de load balancer
