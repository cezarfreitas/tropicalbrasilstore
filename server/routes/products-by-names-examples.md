# API de Produtos por Nomes

## Endpoint: POST /api/products-by-names

Esta API permite criar produtos usando **nomes** ao invés de IDs para categorias, cores e tamanhos. Se os recursos não existirem, eles serão criados automaticamente.

## Formato da Requisição

```json
{
  "name": "Nome do Produto",
  "description": "Descrição do produto",
  "category_name": "Nome da Categoria",
  "base_price": 18.50,
  "sale_price": 25.90,
  "suggested_price": 35.90,
  "sku": "PROD001",
  "parent_sku": "PROD",
  "parent_id": 123,
  "photo_url": "https://example.com/foto.jpg",
  "size_group_name": "Feminino",
  "variants": [
    {
      "size_name": "37",
      "color_name": "Azul",
      "stock": 100,
      "price_override": null
    },
    {
      "size_name": "38",
      "color_name": "Azul", 
      "stock": 80
    },
    {
      "size_name": "37",
      "color_name": "Vermelho",
      "stock": 50
    }
  ]
}
```

## Campos Obrigatórios

- ✅ **name**: Nome do produto
- ✅ **variants**: Array com pelo menos uma variante
- ✅ **variants[].size_name**: Nome do tamanho
- ✅ **variants[].color_name**: Nome da cor

## Campos Opcionais

- **description**: Descrição do produto
- **category_name**: Nome da categoria (será criada se não existir)
- **base_price**: Preço base/custo
- **sale_price**: Preço de venda
- **suggested_price**: Preço sugerido
- **sku**: Código SKU único
- **parent_sku**: SKU pai para agrupamento
- **parent_id**: ID do produto pai (para hierarquia de produtos)
- **photo**: Caminho local da foto (se já estiver no servidor)
- **photo_url**: URL externa da foto (será baixada automaticamente)
- **size_group_name**: Nome do grupo de tamanhos
- **variants[].stock**: Estoque (padrão: 0)
- **variants[].price_override**: Preço específico para esta variante

## Resposta de Sucesso

```json
{
  "message": "Product created successfully",
  "product": {
    "id": 123,
    "name": "Nome do Produto",
    "category_name": "Nome da Categoria",
    "variants": [
      {
        "size_name": "37",
        "color_name": "Azul",
        "stock": 100,
        "hex_code": "#1e40af"
      }
    ],
    "variant_count": 3,
    "total_stock": 230
  },
  "created_resources": {
    "category_created": true,
    "colors_created": ["Azul", "Vermelho"],
    "sizes_created": ["37", "38"],
    "size_group_created": true,
    "photo_status": {
      "downloaded": true,
      "url_original": "https://example.com/foto.jpg",
      "path_saved": "/uploads/products/nome_do_produto.jpg",
      "error": null
    },
    "parent_reference": {
      "parent_id": 123,
      "parent_found": true,
      "parent_name": "Produto Pai"
    }
  },
  "summary": {
    "product_name": "Nome do Produto",
    "variants_created": 4,
    "unique_colors": 2,
    "unique_sizes": 2,
    "total_stock": 230,
    "has_parent": true,
    "has_photo": true
  }
}
```

## Exemplos de Uso

### 1. Produto Simples
```javascript
const produto = {
  "name": "Chinelo Havaianas",
  "description": "Chinelo confortável e durável",
  "category_name": "Calçados",
  "base_price": 15.00,
  "sale_price": 25.00,
  "photo_url": "https://exemplo.com/chinelo-havaianas.jpg",
  "variants": [
    {
      "size_name": "37",
      "color_name": "Azul",
      "stock": 50
    }
  ]
};

### 2. Produto com Hierarquia (Produto Filho)
```javascript
const produtoFilho = {
  "name": "Chinelo Havaianas Top Edição Limitada",
  "description": "Versão especial do clássico Havaianas Top",
  "category_name": "Calçados",
  "parent_id": 123, // ID do produto pai
  "parent_sku": "HAV-TOP",
  "base_price": 22.00,
  "sale_price": 35.00,
  "photo_url": "https://exemplo.com/havaianas-edicao-limitada.jpg",
  "variants": [
    {
      "size_name": "37",
      "color_name": "Dourado",
      "stock": 25
    }
  ]
};

fetch('/api/products-by-names', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(produto)
});
```

### 3. Produto com Múltiplas Variantes
```javascript
const produtoCompleto = {
  "name": "Tênis Nike Air Max",
  "description": "Tênis esportivo confortável",
  "category_name": "Tênis Esportivos",
  "base_price": 150.00,
  "sale_price": 299.99,
  "suggested_price": 399.99,
  "sku": "NIKE-AIR-MAX",
  "parent_sku": "NIKE",
  "photo_url": "https://nike.com/images/air-max.jpg",
  "size_group_name": "Unissex",
  "variants": [
    {
      "size_name": "37",
      "color_name": "Preto",
      "stock": 25
    },
    {
      "size_name": "38",
      "color_name": "Preto",
      "stock": 30
    },
    {
      "size_name": "37",
      "color_name": "Branco",
      "stock": 20
    },
    {
      "size_name": "38",
      "color_name": "Branco",
      "stock": 15,
      "price_override": 319.99
    }
  ]
};
```

## Vantagens

✅ **Criação Automática**: Categorias, cores e tamanhos são criados automaticamente
✅ **Flexibilidade**: Use nomes intuitivos ao invés de IDs
✅ **Download Automático**: Fotos são baixadas e salvas automaticamente
✅ **Relatório**: Retorna quais recursos foram criados
✅ **Validação**: Verifica dados obrigatórios
✅ **Transação**: Operação atômica (tudo ou nada)

## Erros Comuns

- **400**: Nome do produto obrigatório
- **400**: Pelo menos uma variante é obrigatória  
- **400**: SKU já existe
- **400**: Nome e cor obrigatórios para cada variante
- **500**: Erro interno do servidor
