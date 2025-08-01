# API /products/bulk - Suporte a Múltiplas Grades

## Funcionalidade Implementada

A API `/api/products/bulk` agora suporta envio de múltiplas grades em uma única variante.

## Formatos Suportados

### 1. String separada por vírgula (recomendado)
```json
{
  "products": [{
    "codigo": "TB1.2531",
    "nome": "LOGO FEMININA", 
    "categoria": "LOGO FEMININA",
    "tipo": "Sandália",
    "genero": "Feminina",
    "variantes": [{
      "cor": "GELATO",
      "preco": 13.60,
      "grade": "2647,2637,2639",
      "sku": "TB1.2531-GELATO"
    }]
  }]
}
```

### 2. Array de strings
```json
{
  "variantes": [{
    "cor": "AZUL",
    "preco": 15.50,
    "grade": ["Feminina 34-40", "Masculina 38-44", "Infantil"],
    "sku": "TB1.2531-AZUL"
  }]
}
```

### 3. String única (comportamento anterior)
```json
{
  "variantes": [{
    "cor": "VERDE",
    "preco": 12.30,
    "grade": "2647",
    "sku": "TB1.2531-VERDE"
  }]
}
```

## Como Funciona

1. **Processamento**: Para cada grade informada, o sistema cria uma variante separada
2. **SKU**: O SKU é automaticamente gerado como `CODIGO-COR-GRADE`
3. **Grades Automáticas**: Se a grade não existir, será criada automaticamente com tamanhos baseados no nome
4. **Deduplicação**: Se uma combinação produto+cor+grade já existir, será reutilizada

## Exemplo Completo

```json
{
  "products": [{
    "codigo": "TB1.2531",
    "nome": "LOGO FEMININA",
    "categoria": "LOGO FEMININA", 
    "tipo": "Sandália",
    "genero": "Feminina",
    "descricao": "Chinelo Havaianas Top tradicional",
    "preco_sugerido": 13.60,
    "vender_infinito": false,
    "tipo_estoque": "grade",
    "variantes": [
      {
        "cor": "GELATO",
        "preco": 13.60,
        "grade": "2647,2637", // Múltiplas grades
        "foto": "https://example.com/gelato.jpg",
        "sku": "TB1.2531-GELATO"
      },
      {
        "cor": "AZUL",
        "preco": 15.50,
        "grade": ["Feminina 34-40", "Masculina 38-44"], // Array
        "sku": "TB1.2531-AZUL" 
      }
    ]
  }]
}
```

## Resposta da API

A API retornará uma variante para cada combinação cor+grade criada:

```json
{
  "success": true,
  "message": "Processamento concluído com sucesso",
  "data": {
    "produtos_processados": 1,
    "produtos_novos": 1,
    "variantes_novas": 4, // 2 grades GELATO + 2 grades AZUL
    "grades_criadas": ["2647", "2637", "Feminina 34-40", "Masculina 38-44"],
    "produtos": [{
      "id": 123,
      "codigo": "TB1.2531",
      "nome": "LOGO FEMININA",
      "status": "created",
      "variantes": [
        {"cor": "GELATO", "grade": "2647", "sku": "TB1.2531-GELATO-2647"},
        {"cor": "GELATO", "grade": "2637", "sku": "TB1.2531-GELATO-2637"},
        {"cor": "AZUL", "grade": "Feminina 34-40", "sku": "TB1.2531-AZUL-Feminina 34-40"},
        {"cor": "AZUL", "grade": "Masculina 38-44", "sku": "TB1.2531-AZUL-Masculina 38-44"}
      ]
    }]
  }
}
```

## Vantagens

- ✅ Envio de múltiplas grades em uma única requisição
- ✅ Compatibilidade com formato anterior (string única)
- ✅ Flexibilidade: vírgula, array ou string
- ✅ SKUs únicos gerados automaticamente
- ✅ Deduplicação automática de variantes existentes

## Uso Recomendado

Para o seu caso de uso original (`"grade": "2647,2637"`), agora será processado como duas grades separadas, criando duas variantes distintas com SKUs únicos.
