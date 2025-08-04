# API Bulk - Novo Formato produto/variantes

A API bulk foi ajustada para receber o novo formato JSON com estrutura `produto` e `variantes`.

## Formato JSON Suportado

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
    },
    {
      "cor": "Azul",
      "preco": 32.9,
      "foto": "https://exemplo.com/chinelo-azul.jpg",
      "grades": {
        "Infantil": 10,
        "Adulto": 30
      }
    }
  ]
}
```

## Campos do Produto

- `codigo`: Código único do produto (obrigatório)
- `nome`: Nome do produto (obrigatório)
- `categoria`: Categoria do produto
- `tipo`: Tipo do produto
- `marca`: Marca do produto
- `genero`: Gênero do produto
- `descricao`: Descrição do produto
- `preco_sugerido`: Preço sugerido (opcional)
- `vender_infinito`: Se deve vender sem controle de estoque (padrão: false)
- `tipo_estoque`: Tipo de controle de estoque (padrão: "grade")

## Campos das Variantes

- `cor`: Cor da variante (obrigatório)
- `preco`: Preço da variante (obrigatório)
- `foto`: URL da foto da variante (opcional)
- `grades`: Objeto com grades e quantidades em estoque

## Endpoint

```
POST /api/products/bulk
Content-Type: application/json
```

## Exemplo de Teste com curl

```bash
curl -X POST http://localhost:8080/api/products/bulk \
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

## Formatos Suportados pela API

A API bulk agora suporta múltiplos formatos:

1. **Novo formato produto/variantes** (documentado acima)
2. **Array direto de produtos**: `[{produto1}, {produto2}, ...]`
3. **Formato legacy**: `{products: [{produto1}, {produto2}, ...]}`
4. **Produto único**: `{codigo: "...", nome: "...", variantes: [...]}`
5. **Formato planilha**: Com campo `row_number` e campos diretos

## Conversão Automática

A API detecta automaticamente o formato recebido e converte para o formato interno antes do processamento.

## Logs de Debug

Para debugar, verifique os logs do servidor que mostram:

- Formato detectado
- Dados do produto recebidos
- Número de variantes encontradas
- Processamento de cada variante
- Conversão para formato interno
