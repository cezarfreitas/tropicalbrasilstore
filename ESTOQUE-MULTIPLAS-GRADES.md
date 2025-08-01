# Gerenciamento de Estoque com Múltiplas Grades

Quando você usa múltiplas grades na API `/api/products/bulk`, tem diferentes opções para gerenciar o estoque.

## Opção 1: Estoque Array Posicional (Recomendado)

```json
{
  "products": [
    {
      "codigo": "TB1.2522",
      "nome": "LOGO FEMININA",
      "categoria": "LOGO FEMININA",
      "tipo": "Sandália",
      "tipo_estoque": "grade",
      "variantes": [
        {
          "cor": "AZUL ELEMENTAL",
          "preco": 13.6,
          "grade": "2647, 2637",
          "estoque_grade": [15, 20]
        }
      ]
    }
  ]
}
```

**Resultado:**

- Grade 2647 (posição 0): 15 unidades
- Grade 2637 (posição 1): 20 unidades
- **Total**: 35 unidades

**Como funciona:** Cada posição no array `estoque_grade` corresponde à mesma posição na lista de grades.

## Opção 2: Estoque Igual para Todas as Grades

```json
{
  "products": [
    {
      "codigo": "TB1.2522",
      "nome": "LOGO FEMININA",
      "categoria": "LOGO FEMININA",
      "tipo": "Sandália",
      "tipo_estoque": "grade",
      "variantes": [
        {
          "cor": "AZUL ELEMENTAL",
          "preco": 13.6,
          "grade": "2647, 2637",
          "estoque_grade": 100
        }
      ]
    }
  ]
}
```

**Resultado:**

- Grade 2647: 100 unidades
- Grade 2637: 100 unidades
- **Total**: 200 unidades

## Opção 3: Estoque Específico por Grade

```json
{
  "products": [
    {
      "codigo": "TB1.2522",
      "nome": "LOGO FEMININA",
      "categoria": "LOGO FEMININA",
      "tipo": "Sandália",
      "tipo_estoque": "grade",
      "variantes": [
        {
          "cor": "AZUL ELEMENTAL",
          "preco": 13.6,
          "grade": "2647, 2637",
          "estoque_grades": {
            "2647": 50,
            "2637": 75
          }
        }
      ]
    }
  ]
}
```

**Resultado:**

- Grade 2647: 50 unidades
- Grade 2637: 75 unidades
- **Total**: 125 unidades

## Opção 4: Combinação

```json
{
  "products": [
    {
      "codigo": "TB1.2522",
      "nome": "LOGO FEMININA",
      "categoria": "LOGO FEMININA",
      "tipo": "Sandália",
      "tipo_estoque": "grade",
      "variantes": [
        {
          "cor": "AZUL ELEMENTAL",
          "preco": 13.6,
          "grade": "2647, 2637, 2639",
          "estoque_grade": 100, // Default para todas
          "estoque_grades": {
            "2647": 200 // Override apenas para 2647
          }
        }
      ]
    }
  ]
}
```

**Resultado:**

- Grade 2647: 200 unidades (específico tem prioridade)
- Grade 2637: 100 unidades (usa default)
- Grade 2639: 100 unidades (usa default)
- **Total**: 400 unidades

## Prioridade de Estoque

1. **`estoque_grades`** (específico por grade) - **Prioridade ALTA**
2. **`estoque_grade` array** (posicional) - **Prioridade MÉDIA**
3. **`estoque_grade` número** (geral para todas) - **Prioridade BAIXA**

A API verifica nesta ordem e usa a primeira opção disponível.

## Exemplo Prático - E-commerce

```json
{
  "products": [
    {
      "codigo": "HAV001",
      "nome": "Havaianas Top",
      "categoria": "Chinelos",
      "tipo": "Sandália",
      "tipo_estoque": "grade",
      "variantes": [
        {
          "cor": "PRETO",
          "preco": 25.9,
          "grade": "Feminina 34-40, Masculina 38-44",
          "estoque_grade": 50,
          "estoque_grades": {
            "Feminina 34-40": 100 // Mais demanda feminina
          }
        },
        {
          "cor": "AZUL",
          "preco": 25.9,
          "grade": "Infantil 20-33, Feminina 34-40",
          "estoque_grades": {
            "Infantil 20-33": 30,
            "Feminina 34-40": 80
          }
        }
      ]
    }
  ]
}
```

**Resultado do Exemplo:**

- PRETO Feminina: 100 unidades
- PRETO Masculina: 50 unidades
- AZUL Infantil: 30 unidades
- AZUL Feminina: 80 unidades

## Logs da API

A API mostra nos logs qual estratégia está usando:

```
📦 Usando estoque posicional [0] para grade 2647: 15
📦 Usando estoque posicional [1] para grade 2637: 20
✅ Estoque configurado para grade 2647: 15 unidades
✅ Estoque configurado para grade 2637: 20 unidades
```

## Recomendação

Use **Opção 1 (Array Posicional)** para maior simplicidade:

- Formato mais limpo: `"estoque_grade": [15, 20]`
- Correspondência direta com posição das grades
- Mais fácil de ler e manter
- Ideal quando você tem estoque específico para cada grade

Use **Opção 4 (Combinação)** para máxima flexibilidade:

- Define um estoque padrão com `estoque_grade`
- Ajusta grades específicas com `estoque_grades`
- Ideal para casos complexos
