# Exemplo: Estoque Array Posicional

## 🎯 Novo Formato Recomendado

```json
{
  "products": [
    {
      "codigo": "TB1.2522",
      "nome": "LOGO FEMININA",
      "categoria": "LOGO FEMININA",
      "tipo": "Sandália",
      "genero": "Feminina",
      "descricao": "Chinelo Havaianas Top tradicional, confortável e durável. Material borracha de alta qualidade.",
      "preco_sugerido": 13.6,
      "vender_infinito": false,
      "tipo_estoque": "grade",
      "variantes": [
        {
          "cor": "AZUL ELEMENTAL",
          "preco": 13.6,
          "grade": "2647, 2637",
          "foto": "",
          "sku": "TB1.2522-AZULELEMENTAL",
          "estoque_grade": [15, 20]
        }
      ]
    }
  ]
}
```

## ✅ Como Funciona

**Correspondência Posicional:**

- `"grade": "2647, 2637"` → grades nas posições `[0, 1]`
- `"estoque_grade": [15, 20]` → estoques nas posições `[0, 1]`

**Resultado:**

- Grade `2647` (posição 0) = `15` unidades
- Grade `2637` (posição 1) = `20` unidades
- **Total**: 35 unidades

## 📊 Logs da API

```
🔄 Processando grade: 2647 para cor: AZUL ELEMENTAL
📦 Usando estoque posicional [0] para grade 2647: 15
✅ Estoque configurado para grade 2647: 15 unidades

🔄 Processando grade: 2637 para cor: AZUL ELEMENTAL
📦 Usando estoque posicional [1] para grade 2637: 20
✅ Estoque configurado para grade 2637: 20 unidades
```

## 🚀 Vantagens

1. **Mais Limpo**: Não precisa repetir nomes das grades
2. **Intuitivo**: Ordem do array = ordem das grades
3. **Flexível**: Pode misturar com outros formatos
4. **Simples**: Fácil de ler e escrever

## ⚠️ Importante

- O array deve ter o mesmo número de elementos que as grades
- Se faltar posições, as grades extras usarão estoque 0
- Se sobrar posições, elas serão ignoradas

## 🔄 Compatibilidade

O novo formato é **totalmente compatível** com os formatos anteriores:

```json
{
  "estoque_grade": 100, // ✅ Funciona (todos = 100)
  "estoque_grade": [15, 20], // ✅ Funciona (posicional)
  "estoque_grades": {
    // ✅ Funciona (específico)
    "2647": 15,
    "2637": 20
  }
}
```

A API sempre usa a **melhor opção disponível** na ordem de prioridade!
