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

// Get all products with complete information (paginated)
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

    // Get total count
    const [countRows] = await db.execute(
      `SELECT COUNT(p.id) as total
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       ${whereClause}`,
      params,
    );

    const total = (countRows as any)[0].total;

    // Get paginated results with variant and stock information
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
        COUNT(DISTINCT pv.id) as variant_count,
        COALESCE(SUM(pv.stock), 0) as total_stock
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      ${whereClause}
      GROUP BY p.id, p.name, p.description, p.category_id, p.base_price, p.sku, p.parent_sku, p.active, p.sell_without_stock, p.created_at, p.updated_at, c.name
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

// Get product by ID with all information including variants and grades
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
      `SELECT DISTINCT gv.id, gv.name, gv.description, gv.active
       FROM grade_vendida gv
       JOIN product_color_grades pcg ON gv.id = pcg.grade_id
       WHERE pcg.product_id = ?`,
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

// Create new product with variants and grades
router.post("/", async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const {
      name,
      description,
      category_id,
      base_price,
      suggested_price,
      sku,
      parent_sku,
      photo,
      stock,
      variants,
      grades,
    }: CreateProductRequest = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    // Create the product
    const [result] = await connection.execute(
      `INSERT INTO products (name, description, category_id, base_price, sku, parent_sku, active) 
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        description || null,
        category_id || null,
        base_price || null,
        sku || null,
        parent_sku || null,
        stock || 0,
        true,
      ],
    );

    const productId = (result as any).insertId;

    // Create variants if provided
    if (variants && variants.length > 0) {
      for (const variant of variants) {
        if (variant.size_id && variant.color_id) {
          await connection.execute(
            `INSERT INTO product_variants (product_id, size_id, color_id, stock, price_override)
             VALUES (?, ?, ?, ?, ?)`,
            [
              productId,
              variant.size_id,
              variant.color_id,
              variant.stock || 0,
              variant.price_override || null,
            ],
          );
        }
      }
    }

        // Assign grades if provided
    if (grades && grades.length > 0) {
      // Get available colors for this product to assign grades
      const [colors] = await connection.execute(
        "SELECT DISTINCT color_id FROM product_variants WHERE product_id = ?",
        [productId],
      );

      for (const gradeId of grades) {
        // Assign grade to each color variant of the product
        for (const color of colors as any[]) {
          await connection.execute(
            `INSERT IGNORE INTO product_color_grades (product_id, color_id, grade_id)
             VALUES (?, ?, ?)`,
            [productId, color.color_id, gradeId],
          );
        }
      }
    }

    await connection.commit();

    // Fetch the created product with all information
    const [productRows] = await db.execute(
      `SELECT p.*, c.name as category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.id = ?`,
      [productId],
    );

    const product = (productRows as any)[0];

    // Get variants
    const [variantRows] = await db.execute(
      `SELECT pv.*, s.size, c.name as color_name, c.hex_code
       FROM product_variants pv
       LEFT JOIN sizes s ON pv.size_id = s.id
       LEFT JOIN colors c ON pv.color_id = c.id
       WHERE pv.product_id = ?`,
      [productId],
    );

    product.variants = variantRows;
    product.variant_count = (variantRows as any[]).length;
    product.total_stock = (variantRows as any[]).reduce((sum, variant) => sum + (variant.stock || 0), 0);

    res.status(201).json(product);
  } catch (error: any) {
    await connection.rollback();
    console.error("Error creating product:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "SKU already exists" });
    }
    res.status(500).json({ error: "Failed to create product" });
  } finally {
    connection.release();
  }
});

// Update product with variants and grades
router.put("/:id", async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const {
      name,
      description,
      category_id,
      base_price,
      suggested_price,
      sku,
      parent_sku,
      photo,
      stock,
      active,
      sell_without_stock,
      variants,
      grades,
    }: CreateProductRequest & { active?: boolean; sell_without_stock?: boolean } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    // Update the product
    await connection.execute(
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

    // Update variants if provided
    if (variants !== undefined) {
      // Delete existing variants
      await connection.execute(
        "DELETE FROM product_variants WHERE product_id = ?",
        [req.params.id],
      );

      // Create new variants
      if (variants.length > 0) {
        for (const variant of variants) {
          if (variant.size_id && variant.color_id) {
            await connection.execute(
              `INSERT INTO product_variants (product_id, size_id, color_id, stock, price_override)
               VALUES (?, ?, ?, ?, ?)`,
              [
                req.params.id,
                variant.size_id,
                variant.color_id,
                variant.stock || 0,
                variant.price_override || null,
              ],
            );
          }
        }
      }
    }

        // Update grades if provided
    if (grades !== undefined) {
      // Delete existing grade assignments
      await connection.execute(
        "DELETE FROM product_color_grades WHERE product_id = ?",
        [req.params.id],
      );

      // Create new grade assignments
      if (grades.length > 0) {
        // Get available colors for this product to assign grades
        const [colors] = await connection.execute(
          "SELECT DISTINCT color_id FROM product_variants WHERE product_id = ?",
          [req.params.id],
        );

        for (const gradeId of grades) {
          // Assign grade to each color variant of the product
          for (const color of colors as any[]) {
            await connection.execute(
              `INSERT IGNORE INTO product_color_grades (product_id, color_id, grade_id)
               VALUES (?, ?, ?)`,
              [req.params.id, color.color_id, gradeId],
            );
          }
        }
      }
    }

    await connection.commit();

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

    const product = (productRows as any)[0];

    // Get variants
    const [variantRows] = await db.execute(
      `SELECT pv.*, s.size, c.name as color_name, c.hex_code
       FROM product_variants pv
       LEFT JOIN sizes s ON pv.size_id = s.id
       LEFT JOIN colors c ON pv.color_id = c.id
       WHERE pv.product_id = ?`,
      [req.params.id],
    );

            // Get grades
    const [gradeRows] = await db.execute(
      `SELECT DISTINCT gv.id, gv.name, gv.description, gv.active
       FROM grade_vendida gv
       JOIN product_color_grades pcg ON gv.id = pcg.grade_id
       WHERE pcg.product_id = ?`,
      [req.params.id],
    );

    product.variants = variantRows;
    product.grades = gradeRows;
    product.variant_count = (variantRows as any[]).length;
    product.total_stock = (variantRows as any[]).reduce((sum, variant) => sum + (variant.stock || 0), 0);

    res.json(product);
  } catch (error: any) {
    await connection.rollback();
    console.error("Error updating product:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "SKU already exists" });
    }
    res.status(500).json({ error: "Failed to update product" });
  } finally {
    connection.release();
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
