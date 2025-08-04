# 📋 TABELAS USADAS NO CARD DE PRODUTO

## 🎯 Resumo

O card de produto na loja utiliza **5 tabelas principais** do banco de dados para exibir todas as informações necessárias.

---

## 📊 TABELAS PRINCIPAIS

### 1. **`products`** - Tabela Principal

```sql
SELECT p.id, p.name, p.description, p.base_price, p.suggested_price,
       p.photo, p.active, p.sell_without_stock, p.stock_type
FROM products p
WHERE p.active = true
```

**Campos utilizados no card:**

- `id` - ID único do produto
- `name` - Nome exibido no card
- `photo` - Imagem principal do produto
- `base_price` - Preço base para exibição
- `suggested_price` - Preço sugerido (riscado)
- `stock_type` - Tipo de controle de estoque ('size' ou 'grade')
- `sell_without_stock` - Se permite venda sem estoque

---

### 2. **`categories`** - Categorias dos Produtos

```sql
LEFT JOIN categories c ON p.category_id = c.id
```

**Campos utilizados no card:**

- `c.name as category_name` - Nome da categoria (badge no card)

---

### 3. **`product_color_variants`** - Variantes de Cor (PRINCIPAL PARA IMAGENS)

```sql
SELECT DISTINCT co.id, co.name, co.hex_code, pcv.image_url
FROM product_color_variants pcv
LEFT JOIN colors co ON pcv.color_id = co.id
WHERE pcv.product_id = ? AND pcv.active = true AND co.id IS NOT NULL
```

**Campos utilizados no card:**

- `pcv.image_url` - **IMAGEM PRINCIPAL DO CARD** 🖼️
- `co.id` - ID da cor
- `co.name` - Nome da cor
- `co.hex_code` - Código hexadecimal da cor

---

### 4. **`colors`** - Cores Disponíveis

```sql
LEFT JOIN colors co ON pcv.color_id = co.id
```

**Campos utilizados no card:**

- `name` - Nome da cor para os botões de variante
- `hex_code` - Cor de fundo dos botões de variante

---

### 5. **`product_variants`** - Variantes de Estoque (Fallback)

```sql
-- Usado apenas quando não há product_color_variants
SELECT DISTINCT co.id, co.name, co.hex_code
FROM product_variants pv
LEFT JOIN colors co ON pv.color_id = co.id
WHERE pv.product_id = ? AND (pv.stock > 0 OR ? = 1)
```

**Usado como fallback quando:**

- Produto não tem `product_color_variants`
- `stock_type = 'size'`

---

## 🔄 FLUXO DE CONSULTAS NO CARD

### **Sequência de Consultas:**

1. **Consulta Principal** - Busca produtos com categoria:

```sql
SELECT p.*, c.name as category_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.active = true
```

2. **Para cada produto** - Busca cores e imagens:

```sql
-- PRIORIDADE 1: WooCommerce-style variants (COM IMAGENS)
SELECT co.id, co.name, co.hex_code, pcv.image_url
FROM product_color_variants pcv
LEFT JOIN colors co ON pcv.color_id = co.id
WHERE pcv.product_id = ?

-- PRIORIDADE 2: Fallback para product_variants (SEM IMAGENS)
SELECT co.id, co.name, co.hex_code
FROM product_variants pv
LEFT JOIN colors co ON pv.color_id = co.id
WHERE pv.product_id = ?
```

---

## 🖼️ IMAGENS NO CARD

### **Prioridade de Exibição:**

1. **Imagem selecionada pelo usuário** (clique nas cores)
2. **`product_color_variants.image_url`** (primeira cor com imagem)
3. **`products.photo`** (foto principal do produto)
4. **Placeholder** 📦 (se nenhuma imagem disponível)

### **Fonte Principal das Imagens:**

- **90% das imagens**: `product_color_variants.image_url`
- **10% fallback**: `products.photo`

---

## 📱 CAMPOS EXIBIDOS NO CARD

### **Informações Visuais:**

- **Nome**: `products.name`
- **Categoria**: `categories.name` (badge azul)
- **Preço**: `products.base_price` e `products.suggested_price`
- **Imagem**: `product_color_variants.image_url` ou `products.photo`

### **Interações:**

- **Cores Disponíveis**: Botões com `colors.name` e `colors.hex_code`
- **Troca de Imagem**: Click nas cores altera para `product_color_variants.image_url`

---

## ⚡ PERFORMANCE

### **Consultas por Página:**

- **1 consulta** para listar produtos + categorias
- **N consultas** para cores (1 por produto)
- **Total**: ~21 consultas para 20 produtos

### **Otimizações Possíveis:**

1. JOIN único para todas as tabelas
2. Cache das cores por produto
3. Lazy loading das imagens

---

## 🎯 CONCLUSÃO

**5 TABELAS ESSENCIAIS PARA O CARD:**

1. **`products`** - Dados básicos do produto
2. **`categories`** - Nome da categoria
3. **`product_color_variants`** - **IMAGENS E CORES PRINCIPAIS** 🔥
4. **`colors`** - Detalhes das cores
5. **`product_variants`** - Fallback para cores

**TABELA MAIS IMPORTANTE**: `product_color_variants` (contém as imagens!)
