import { Router } from "express";
import db from "../lib/db";

const router = Router();

interface ProductVariant {
  id?: number;
  size_id: number;
  color_id: number;
  stock: number;
  price_override?: number;
}

interface CreateProductRequest {
  name: string;
  description?: string;
  category_id?: number;
  base_price?: number;
  suggested_price?: number;
  sku?: string;
  parent_sku?: string;
  photo?: string;
  stock?: number;
  variants: ProductVariant[];
  grades: number[];
}

// Get all products with complete information (simplified to work with current schema)
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const search = (req.query.search as string) || "";
    const category = (req.query.category as string) || "";
    const status = (req.query.status as string) || "";
    const sortBy = (req.query.sortBy as string) || "name";
    const sortOrder = (req.query.sortOrder as string) || "asc";

    // Build WHERE conditions
    const conditions = [];
    const params = [];

    if (search) {
      conditions.push(
        "(p.name LIKE ? OR p.sku LIKE ? OR p.description LIKE ?)",
      );
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (category) {
      conditions.push("p.category_id = ?");
      params.push(parseInt(category));
    }

    if (status === "active") {
      conditions.push("p.active = 1");
    } else if (status === "inactive") {
      conditions.push("p.active = 0");
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Valid sort columns and build ORDER BY clause safely
    const validSortColumns = ["name", "created_at", "base_price"];
    let orderByClause = "ORDER BY p.name ASC";

    if (validSortColumns.includes(sortBy)) {
      const orderDirection =
        sortOrder.toLowerCase() === "desc" ? "DESC" : "ASC";
      orderByClause = `ORDER BY p.${sortBy} ${orderDirection}`;
    }

    // Get total count first (simplified to work with current schema)
    const [countRows] = await db.execute(
      `SELECT COUNT(p.id) as total
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       ${whereClause}`,
      params,
    );

    const total = (countRows as any)[0].total;

    // Get paginated results (simplified to work with current schema)
    const paginatedQuery = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.category_id,
        p.base_price,
                p.sku,
        p.parent_sku,
                p.active,
        p.sell_without_stock,
        p.created_at,
        p.updated_at,
        c.name as category_name,
        0 as variant_count,
        0 as total_stock
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      ${whereClause}
      ${orderByClause}
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [rows] = await db.execute(paginatedQuery, params);

    res.json({
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// Get product by ID with all information
router.get("/:id", async (req, res) => {
  try {
    // Get basic product info
    const [productRows] = await db.execute(
      `SELECT p.*, c.name as category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.id = ?`,
      [req.params.id],
    );

    if (productRows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

        const product = (productRows as any)[0];

    // Get product variants
    const [variantRows] = await db.execute(
      `SELECT
        pv.id,
        pv.size_id,
        pv.color_id,
        pv.stock,
        pv.price_override,
        s.size,
        s.display_order,
        c.name as color_name,
        c.hex_code
       FROM product_variants pv
       LEFT JOIN sizes s ON pv.size_id = s.id
       LEFT JOIN colors c ON pv.color_id = c.id
       WHERE pv.product_id = ?
       ORDER BY s.display_order, c.name`,
      [req.params.id],
    );

    // Get product grades (if they exist)
    const [gradeRows] = await db.execute(
      `SELECT g.id, g.name, g.description, g.active
       FROM grade_templates g
       JOIN product_color_grades pcg ON g.id = pcg.grade_template_id
       WHERE pcg.product_id = ?
       GROUP BY g.id`,
      [req.params.id],
    );

    product.variants = variantRows;
    product.grades = gradeRows;
    product.variant_count = (variantRows as any[]).length;
    product.total_stock = (variantRows as any[]).reduce((sum, variant) => sum + (variant.stock || 0), 0);

    res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// Create new product (simplified)
router.post("/", async (req, res) => {
  try {
    const { name, description, category_id, base_price, sku, parent_sku } =
      req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    // Create the product
    const [result] = await db.execute(
      `INSERT INTO products (name, description, category_id, base_price, sku, parent_sku) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        name,
        description || null,
        category_id || null,
        base_price || null,
        sku || null,
        parent_sku || null,
      ],
    );

    const productId = (result as any).insertId;

    // Fetch the created product with all information
    const [productRows] = await db.execute(
      `SELECT p.*, c.name as category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.id = ?`,
      [productId],
    );

    res.status(201).json((productRows as any)[0]);
  } catch (error: any) {
    console.error("Error creating product:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "SKU already exists" });
    }
    res.status(500).json({ error: "Failed to create product" });
  }
});

// Update product (simplified)
router.put("/:id", async (req, res) => {
  try {
    const {
      name,
      description,
      category_id,
      base_price,
      sku,
      parent_sku,
      active,
      sell_without_stock,
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    // Update the product
    await db.execute(
      `UPDATE products SET 
         name = ?, description = ?, category_id = ?, base_price = ?, 
                           sku = ?, parent_sku = ?, active = ?, sell_without_stock = ?
       WHERE id = ?`,
      [
        name,
        description || null,
        category_id || null,
        base_price || null,
        sku || null,
        parent_sku || null,
        active !== undefined ? active : true,
        sell_without_stock !== undefined ? sell_without_stock : false,
        req.params.id,
      ],
    );

    // Fetch the updated product
    const [productRows] = await db.execute(
      `SELECT p.*, c.name as category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.id = ?`,
      [req.params.id],
    );

    if (productRows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json((productRows as any)[0]);
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

// Toggle product status (quick endpoint)
router.patch("/:id/toggle", async (req, res) => {
  try {
    // Get current status
    const [currentRows] = await db.execute(
      "SELECT active FROM products WHERE id = ?",
      [req.params.id],
    );

    if (currentRows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    const currentProduct = (currentRows as any)[0];
    const newStatus = !currentProduct.active;

    // Update status
    await db.execute("UPDATE products SET active = ? WHERE id = ?", [
      newStatus,
      req.params.id,
    ]);

    res.json({
      success: true,
      active: newStatus,
      message: `Produto ${newStatus ? "ativado" : "desativado"} com sucesso`,
    });
  } catch (error) {
    console.error("Error toggling product status:", error);
    res.status(500).json({ error: "Failed to toggle product status" });
  }
});

// Toggle sell without stock (quick endpoint)
router.patch("/:id/toggle-sell-without-stock", async (req, res) => {
  try {
    // Get current status
    const [currentRows] = await db.execute(
      "SELECT sell_without_stock FROM products WHERE id = ?",
      [req.params.id],
    );

    if (currentRows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    const currentProduct = (currentRows as any)[0];
    const newStatus = !currentProduct.sell_without_stock;

    // Update status
    await db.execute(
      "UPDATE products SET sell_without_stock = ? WHERE id = ?",
      [newStatus, req.params.id],
    );

    res.json({
      success: true,
      sell_without_stock: newStatus,
      message: `Venda sem estoque ${newStatus ? "ativada" : "desativada"} com sucesso`,
    });
  } catch (error) {
    console.error("Error toggling sell without stock:", error);
    res.status(500).json({ error: "Failed to toggle sell without stock" });
  }
});

export { router as productsEnhancedRouter };
