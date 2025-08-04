# 🔄 Workaround: Usar Formato Legacy

Enquanto a nova versão não for deployada, use o formato que a produção atual aceita:

## 📝 Converter Formato produto/variantes → Legacy

**Seu formato atual:**

```json
{
  "produto": {
    "codigo": "CHN001",
    "nome": "Chinelo Havaianas Top",
    "categoria": "Chinelos",
    "tipo": "Casual",
    "marca": "Havaianas",
    "genero": "Unissex",
    "descricao": "O chinelo mais famoso do Brasil",
    "preco_sugerido": 39.9,
    "vender_infinito": false,
    "tipo_estoque": "grade"
  },
  "variantes": [
    {
      "cor": "Preto",
      "preco": 29.9,
      "foto": "https://exemplo.com/chinelo-preto.jpg",
      "grades": {
        "Infantil": 15,
        "Adulto": 25
      }
    }
  ]
}
```

**Converter para formato legacy:**

```json
{
  "products": [
    {
      "codigo": "CHN001",
      "nome": "Chinelo Havaianas Top",
      "categoria": "Chinelos",
      "tipo": "Casual",
      "marca": "Havaianas",
      "genero": "Unissex",
      "descricao": "O chinelo mais famoso do Brasil",
      "preco_sugerido": 39.9,
      "vender_infinito": false,
      "tipo_estoque": "grade",
      "variantes": [
        {
          "cor": "Preto",
          "preco": 29.9,
          "foto": "https://exemplo.com/chinelo-preto.jpg",
          "grades": {
            "Infantil": 15,
            "Adulto": 25
          }
        }
      ]
    }
  ]
}
```

## 🔧 Script de Conversão para N8n

Se estiver usando N8n, pode adicionar um nó de código para converter:

```javascript
// N8n Code Node - Converter formato
const input = $input.all()[0].json;

const convertedData = {
  products: [
    {
      ...input.produto,
      variantes: input.variantes,
    },
  ],
};

return [{ json: convertedData }];
```

## ⚡ Teste Rápido com Curl

```bash
curl -X POST https://b2b.tropicalbrasilsandalias.com.br/api/products/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "products": [
      {
        "codigo": "CHN001",
        "nome": "Chinelo Havaianas Top",
        "categoria": "Chinelos",
        "tipo": "Casual",
        "marca": "Havaianas",
        "genero": "Unissex",
        "descricao": "O chinelo mais famoso do Brasil",
        "preco_sugerido": 39.90,
        "vender_infinito": false,
        "tipo_estoque": "grade",
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
      }
    ]
  }'
```

## ⚠️ Importante

Este é um **workaround temporário**. Para usar o formato `produto/variantes` conforme solicitado, **é necessário fazer o deploy da nova versão**.
