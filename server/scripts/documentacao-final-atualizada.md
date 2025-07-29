# 📋 API de Produtos Bulk - Documentação Completa Atualizada

## 🎯 **Nova Funcionalidade: Preço Sugerido**

### **Campo Adicionado:**

- ✅ **`preco_sugerido`** (opcional) - Preço sugerido de venda para o produto

---

## 📝 **Estrutura Completa do JSON**

### **🔑 Campos Obrigatórios:**

```json
{
  "codigo": "string",     // SKU único do produto
  "nome": "string",       // Nome do produto
  "categoria": "string",  // Categoria (criada automaticamente)
  "tipo": "string",       // Tipo do produto
  "variantes": [...]      // Array com pelo menos 1 variante
}
```

### **📋 Campos Opcionais do Produto:**

```json
{
  "genero": "string",           // Masculino/Feminino/Unissex/Infantil
  "descricao": "string",        // Descrição do produto
  "preco_sugerido": number,     // 🆕 Preço sugerido de venda
  "vender_infinito": boolean    // true = venda sem controle de estoque
}
```

### **🎨 Campos da Variante:**

```json
{
  "cor": "string",              // Nome da cor (obrigatório)
  "preco": number,              // Preço da variante (obrigatório)
  "grade": "string",            // Nome da grade (obrigatório)
  "foto": "string",             // URL da imagem (opcional)
  "sku": "string"               // SKU específico (opcional)
}
```

---

## 🔗 **Exemplo Completo Atualizado**

```bash
curl --location 'https://ide-lojatropical.4kw6ps.easypanel.host/api/products/bulk' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer sk_live_abcd1234567890abcdef1234567890abcdef12' \
--data-raw '{
  "products": [
    {
      "codigo": "CHN001",
      "nome": "Chinelo Havaianas Top",
      "categoria": "Chinelos",
      "tipo": "Casual",
      "genero": "Masculino",
      "descricao": "O chinelo mais famoso do Brasil",
      "preco_sugerido": 39.90,
      "vender_infinito": true,
      "variantes": [
        {
          "cor": "Preto",
          "preco": 29.90,
          "grade": "Grade Masculina",
          "foto": "https://images.tcdn.com.br/img/img_prod/699671/chinelo_havaianas_top_masculino_preto_24851_1_da2ff112816d222cd40bc1e93a37953a_20250313182035.jpg"
        }
      ]
    }
  ]
}'
```

---

## 💰 **Diferença entre Preços**

### **Preço Base (`base_price`):**

- ✅ Calculado automaticamente a partir da primeira variante
- ✅ Usado para cálculos internos do sistema
- ✅ Corresponde ao `preco` da variante

### **Preço Sugerido (`suggested_price`):**

- ✅ Campo opcional fornecido no JSON
- ✅ Representa o preço recomendado de venda
- ✅ Pode ser diferente do preço base
- ✅ Usado para orientação comercial

### **Exemplo Prático:**

```json
{
  "codigo": "CHN001",
  "nome": "Chinelo Premium",
  "preco_sugerido": 49.9, // ← Preço recomendado
  "variantes": [
    {
      "cor": "Preto",
      "preco": 35.9 // ← Preço base/custo
    }
  ]
}
```

**Resultado:**

- **Base Price**: R$ 35,90 (custo/preço mínimo)
- **Suggested Price**: R$ 49,90 (preço sugerido de venda)

---

## 🔄 **Criação Incremental (Mantida)**

### **1ª Requisição - Criar produto:**

```json
{
  "products": [
    {
      "codigo": "CHN001",
      "nome": "Chinelo Havaianas Top",
      "categoria": "Chinelos",
      "tipo": "Casual",
      "genero": "Masculino",
      "preco_sugerido": 39.9,
      "vender_infinito": true,
      "variantes": [
        {
          "cor": "Preto",
          "preco": 29.9,
          "grade": "Grade Masculina"
        }
      ]
    }
  ]
}
```

### **2ª Requisição - Adicionar variante:**

```json
{
  "products": [
    {
      "codigo": "CHN001",
      "variantes": [
        {
          "cor": "Azul",
          "preco": 29.9,
          "grade": "Grade Masculina"
        }
      ]
    }
  ]
}
```

### **3ª Requisição - Atualizar preço sugerido:**

```json
{
  "products": [
    {
      "codigo": "CHN001",
      "preco_sugerido": 49.9,
      "variantes": [
        {
          "cor": "Branco",
          "preco": 32.9,
          "grade": "Grade Masculina"
        }
      ]
    }
  ]
}
```

---

## ✅ **Funcionalidades Implementadas**

1. ✅ **Criação incremental de variantes**
2. ✅ **Upload automático de imagens**
3. ✅ **Grades automáticas por tipo**
4. ✅ **Venda infinita (sem estoque)**
5. ✅ **🆕 Preço sugerido de venda**
6. ✅ **Compatibilidade com interface admin**
7. ✅ **Detecção de duplicatas**
8. ✅ **Criação automática de entidades**

---

## 📊 **Resposta da API Atualizada**

```json
{
  "success": true,
  "message": "Processamento concluído com sucesso",
  "data": {
    "produtos_novos": 1,
    "produtos_atualizados": 0,
    "variantes_novas": 1,
    "variantes_existentes": 0,
    "total_variantes": 1,
    "categorias_criadas": ["Chinelos"],
    "tipos_criados": ["Casual"],
    "cores_criadas": ["Preto"],
    "grades_criadas": ["Grade Masculina"],
    "produtos": [
      {
        "id": 142,
        "codigo": "CHN001",
        "nome": "Chinelo Havaianas Top",
        "status": "created",
        "variantes": [
          {
            "id": 571,
            "cor": "Preto",
            "sku": "CHN001-PRETO",
            "grade": "Grade Masculina",
            "preco": 29.9,
            "status": "created"
          }
        ]
      }
    ]
  }
}
```

**A API agora suporta preço sugerido para orientação comercial! 🚀**
