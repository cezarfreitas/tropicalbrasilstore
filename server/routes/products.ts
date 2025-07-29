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
