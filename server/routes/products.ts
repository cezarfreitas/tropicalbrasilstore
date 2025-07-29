import { Router } from "express";
import db from "../lib/db";
import { Product, CreateProductRequest } from "@shared/types";

interface BulkProductVariant {
  cor: string;
  preco: number;
  grade: string;
  foto?: string;
  sku?: string;
}

interface BulkProduct {
  codigo: string;
  nome: string;
  categoria: string;
  tipo: string;
  descricao?: string;
  variantes: BulkProductVariant[];
}

interface BulkProductsRequest {
  products: BulkProduct[];
}

const router = Router();

// Função auxiliar para criar ou buscar categoria
async function getOrCreateCategory(name: string): Promise<number> {
  // Buscar categoria existente
  const [existing] = await db.execute(
    "SELECT id FROM categories WHERE name = ?",
    [name]
  );

  if ((existing as any[]).length > 0) {
    return (existing as any[])[0].id;
  }

  // Criar nova categoria
  const [result] = await db.execute(
    "INSERT INTO categories (name, show_in_menu) VALUES (?, ?)",
    [name, true]
  );

  return (result as any).insertId;
}

// Função auxiliar para criar ou buscar tipo
async function getOrCreateType(name: string): Promise<number> {
  // Buscar tipo existente
  const [existing] = await db.execute(
    "SELECT id FROM types WHERE name = ?",
    [name]
  );

  if ((existing as any[]).length > 0) {
    return (existing as any[])[0].id;
  }

  // Criar novo tipo
  const [result] = await db.execute(
    "INSERT INTO types (name, description) VALUES (?, ?)",
    [name, `Tipo ${name} criado automaticamente`]
  );

  return (result as any).insertId;
}

// Função auxiliar para criar ou buscar cor
async function getOrCreateColor(name: string): Promise<number> {
  // Buscar cor existente
  const [existing] = await db.execute(
    "SELECT id FROM colors WHERE name = ?",
    [name]
  );

  if ((existing as any[]).length > 0) {
    return (existing as any[])[0].id;
  }

  // Criar nova cor
  const [result] = await db.execute(
    "INSERT INTO colors (name) VALUES (?)",
    [name]
  );

  return (result as any).insertId;
}

// Função auxiliar para criar ou buscar grade
async function getOrCreateGrade(name: string): Promise<number> {
  // Buscar grade existente
  const [existing] = await db.execute(
    "SELECT id FROM grade_vendida WHERE name = ?",
    [name]
  );

  if ((existing as any[]).length > 0) {
    return (existing as any[])[0].id;
  }

  // Criar nova grade com tamanhos automáticos baseados no nome
  const [result] = await db.execute(
    "INSERT INTO grade_vendida (name, description) VALUES (?, ?)",
    [name, `Grade ${name} criada automaticamente`]
  );

  const gradeId = (result as any).insertId;

  // Criar tamanhos automáticos baseados no tipo de grade
  let sizes: string[] = [];
  const lowerName = name.toLowerCase();

  if (lowerName.includes('feminina') || lowerName.includes('fem')) {
    sizes = ['34', '35', '36', '37', '38', '39', '40'];
  } else if (lowerName.includes('masculina') || lowerName.includes('masc')) {
    sizes = ['38', '39', '40', '41', '42', '43', '44'];
  } else if (lowerName.includes('infantil') || lowerName.includes('criança')) {
    sizes = ['20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33'];
  } else {
    // Grade unissex padrão
    sizes = ['35', '36', '37', '38', '39', '40', '41', '42'];
  }

  // Inserir os tamanhos da grade
  for (const size of sizes) {
    await db.execute(
      "INSERT INTO grade_items (grade_id, size, price, position) VALUES (?, ?, ?, ?)",
      [gradeId, size, 0, sizes.indexOf(size) + 1]
    );
  }

  return gradeId;
}

// Bulk create products with variants and grades
router.post("/bulk", async (req, res) => {
  try {
    const { products }: BulkProductsRequest = req.body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Products array is required"
      });
    }

    const createdProducts = [];
    const categoriesCreated = new Set<string>();
    const typesCreated = new Set<string>();
    const colorsCreated = new Set<string>();
    const gradesCreated = new Set<string>();
    let variantesCreadas = 0;

    // Processar cada produto
    for (const product of products) {
      // Validações básicas
      if (!product.codigo || !product.nome || !product.variantes || product.variantes.length === 0) {
        return res.status(422).json({
          success: false,
          error: "Dados inválidos",
          message: "Código, nome e pelo menos uma variante são obrigatórios"
        });
      }

      // Verificar se produto com código já existe
      const [existingProduct] = await db.execute(
        "SELECT id FROM products WHERE sku = ?",
        [product.codigo]
      );

      if ((existingProduct as any[]).length > 0) {
        return res.status(400).json({
          success: false,
          error: "Código já existe",
          message: `O produto com código '${product.codigo}' já está cadastrado`,
          code: "DUPLICATE_CODE"
        });
      }

      // Criar ou buscar categoria
      const categoryId = await getOrCreateCategory(product.categoria);
      categoriesCreated.add(product.categoria);

      // Criar ou buscar tipo
      const typeId = await getOrCreateType(product.tipo);
      typesCreated.add(product.tipo);

      // Criar produto principal
      const [productResult] = await db.execute(
        "INSERT INTO products (name, description, category_id, sku, active) VALUES (?, ?, ?, ?, ?)",
        [product.nome, product.descricao || null, categoryId, product.codigo, true]
      );

      const productId = (productResult as any).insertId;
      const variants = [];

      // Processar cada variante
      for (const variante of product.variantes) {
        if (!variante.cor || variante.preco <= 0 || !variante.grade) {
          return res.status(422).json({
            success: false,
            error: "Dados inválidos",
            message: "Cor, preço > 0 e grade são obrigatórios para cada variante"
          });
        }

        // Criar ou buscar cor
        const colorId = await getOrCreateColor(variante.cor);
        colorsCreated.add(variante.cor);

        // Criar ou buscar grade
        const gradeId = await getOrCreateGrade(variante.grade);
        gradesCreated.add(variante.grade);

        // Gerar SKU para variante se não fornecido
        const variantSku = variante.sku || `${product.codigo}-${variante.cor.toUpperCase().replace(/\s+/g, '-')}`;

        // Inserir relação produto-cor-grade
        const [variantResult] = await db.execute(
          `INSERT INTO product_color_grades
           (product_id, color_id, grade_id)
           VALUES (?, ?, ?)`,
          [productId, colorId, gradeId]
        );

        // Atualizar preço base do produto se necessário
        await db.execute(
          "UPDATE products SET base_price = ? WHERE id = ? AND base_price IS NULL",
          [variante.preco, productId]
        );

        variants.push({
          id: (variantResult as any).insertId,
          cor: variante.cor,
          sku: variantSku,
          grade: variante.grade,
          preco: variante.preco
        });

        variantesCreadas++;
      }

      createdProducts.push({
        id: productId,
        codigo: product.codigo,
        nome: product.nome,
        variantes: variants
      });
    }

    // Resposta de sucesso
    res.status(201).json({
      success: true,
      message: "Produtos cadastrados com sucesso",
      data: {
        produtos_criados: products.length,
        variantes_criadas: variantesCreadas,
        categorias_criadas: Array.from(categoriesCreated),
        tipos_criados: Array.from(typesCreated),
        cores_criadas: Array.from(colorsCreated),
        grades_criadas: Array.from(gradesCreated),
        produtos: createdProducts
      }
    });

  } catch (error: any) {
    console.error("Error in bulk product creation:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
      message: "Não foi possível processar os produtos"
    });
  }
});

// Single product create with one variant
router.post("/single", async (req, res) => {
  try {
    const { codigo, nome, categoria, tipo, descricao, cor, preco, grade, foto } = req.body;

    // Validações básicas
    if (!codigo || !nome || !cor || !preco || preco <= 0 || !grade) {
      return res.status(422).json({
        success: false,
        error: "Dados inválidos",
        message: "Código, nome, cor, preço > 0 e grade são obrigatórios"
      });
    }

    // Verificar se produto com código já existe
    const [existingProduct] = await db.execute(
      "SELECT id FROM products WHERE sku = ?",
      [codigo]
    );

    if ((existingProduct as any[]).length > 0) {
      return res.status(400).json({
        success: false,
        error: "Código já existe",
        message: `O produto com código '${codigo}' já está cadastrado`,
        code: "DUPLICATE_CODE"
      });
    }

    // Criar ou buscar entidades
    const categoryId = await getOrCreateCategory(categoria);
    const typeId = await getOrCreateType(tipo);
    const colorId = await getOrCreateColor(cor);
    const gradeId = await getOrCreateGrade(grade);

    // Criar produto
    const [productResult] = await db.execute(
      "INSERT INTO products (name, description, category_id, sku, base_price, active) VALUES (?, ?, ?, ?, ?, ?)",
      [nome, descricao || null, categoryId, codigo, preco, true]
    );

    const productId = (productResult as any).insertId;

    // Criar relação produto-cor-grade
    await db.execute(
      "INSERT INTO product_color_grades (product_id, color_id, grade_id) VALUES (?, ?, ?)",
      [productId, colorId, gradeId]
    );

    // Resposta de sucesso
    res.status(201).json({
      success: true,
      message: "Produto cadastrado com sucesso",
      data: {
        id: productId,
        codigo,
        nome,
        categoria,
        tipo,
        cor,
        grade,
        preco
      }
    });

  } catch (error: any) {
    console.error("Error creating single product:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
      message: "Não foi possível criar o produto"
    });
  }
});

// Get all products with category information
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      ORDER BY p.name
    `);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// Get product variants by codigo
router.get("/:codigo/variants", async (req, res) => {
  try {
    const { codigo } = req.params;

    const [rows] = await db.execute(`
      SELECT
        pcg.id,
        c.name as cor,
        p.base_price as preco,
        g.id as grade_id,
        g.name as grade_nome,
        NULL as foto,
        COALESCE(SUM(gt.required_quantity), 0) as estoque_total
      FROM products p
      JOIN product_color_grades pcg ON p.id = pcg.product_id
      JOIN colors c ON pcg.color_id = c.id
      JOIN grade_vendida g ON pcg.grade_id = g.id
      LEFT JOIN grade_templates gt ON g.id = gt.grade_id
      WHERE p.sku = ? AND p.active = true
      GROUP BY pcg.id, c.name, p.base_price, g.id, g.name
      ORDER BY c.name
    `, [codigo]);

    if ((rows as any[]).length === 0) {
      return res.status(404).json({
        success: false,
        error: "Produto não encontrado",
        message: `Nenhum produto encontrado com código '${codigo}'`
      });
    }

    res.json(rows);
  } catch (error) {
    console.error("Error fetching product variants:", error);
    res.status(500).json({ error: "Failed to fetch product variants" });
  }
});

// Get product by ID
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT p.*, c.name as category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.id = ?`,
      [req.params.id],
    );
    const products = rows as any[];
    if (products.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(products[0]);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// Create new product
router.post("/", async (req, res) => {
  try {
    const {
      name,
      description,
      category_id,
      base_price,
      sku,
    }: CreateProductRequest = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    const [result] = await db.execute(
      "INSERT INTO products (name, description, category_id, base_price, sku) VALUES (?, ?, ?, ?, ?)",
      [
        name,
        description || null,
        category_id || null,
        base_price || null,
        sku || null,
      ],
    );

    const insertResult = result as any;
    const [rows] = await db.execute(
      `SELECT p.*, c.name as category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.id = ?`,
      [insertResult.insertId],
    );
    const products = rows as any[];

    res.status(201).json(products[0]);
  } catch (error: any) {
    console.error("Error creating product:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "SKU already exists" });
    }
    res.status(500).json({ error: "Failed to create product" });
  }
});

// Update product
router.put("/:id", async (req, res) => {
  try {
    const {
      name,
      description,
      category_id,
      base_price,
      sku,
      active,
    }: CreateProductRequest & { active?: boolean } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    await db.execute(
      "UPDATE products SET name = ?, description = ?, category_id = ?, base_price = ?, sku = ?, active = ? WHERE id = ?",
      [
        name,
        description || null,
        category_id || null,
        base_price || null,
        sku || null,
        active !== undefined ? active : true,
        req.params.id,
      ],
    );

    const [rows] = await db.execute(
      `SELECT p.*, c.name as category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.id = ?`,
      [req.params.id],
    );
    const products = rows as any[];

    if (products.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(products[0]);
  } catch (error: any) {
    console.error("Error updating product:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "SKU already exists" });
    }
    res.status(500).json({ error: "Failed to update product" });
  }
});

// Delete product
router.delete("/:id", async (req, res) => {
  try {
    const [result] = await db.execute("DELETE FROM products WHERE id = ?", [
      req.params.id,
    ]);
    const deleteResult = result as any;

    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

export { router as productsRouter };
