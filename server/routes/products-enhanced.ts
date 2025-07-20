import { Router } from "express";
import db from "../lib/db";

const router = Router();

// Get all products with complete information including variants
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
    } else if (sortBy === "total_stock") {
      const orderDirection =
        sortOrder.toLowerCase() === "desc" ? "DESC" : "ASC";
      orderByClause = `ORDER BY total_stock ${orderDirection}`;
    }

    // Get total count first
    const [countRows] = await db.execute(
      `SELECT COUNT(DISTINCT p.id) as total
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       LEFT JOIN product_variants pv ON p.id = pv.product_id
       ${whereClause}`,
      params,
    );

    const total = (countRows as any)[0].total;

    // Get paginated results using template literals for LIMIT/OFFSET
    const paginatedQuery = `
      SELECT 
        p.*,
        c.name as category_name,
        COUNT(DISTINCT pv.id) as variant_count,
        COALESCE(SUM(pv.stock), 0) as total_stock
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      ${whereClause}
      GROUP BY p.id
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

// Get product by ID with all variants, sizes, colors, and grades
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

    // Get product variants with size and color info
    const [variantRows] = await db.execute(
      `SELECT 
        pv.*,
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

    // Get associated grades
    const [gradeRows] = await db.execute(
      `SELECT g.id, g.name, g.description
       FROM grade_vendida g
       INNER JOIN product_grades pg ON g.id = pg.grade_id
       WHERE pg.product_id = ?`,
      [req.params.id],
    );

    product.variants = variantRows;
    product.grades = gradeRows;

    res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// Create new product with variants
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
      photo,
      stock,
      variants = [],
      grades = [],
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    // Create the product
    const [result] = await connection.execute(
      `INSERT INTO products (name, description, category_id, base_price, suggested_price, sku, photo, stock) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        description || null,
        category_id || null,
        base_price || null,
        suggested_price || null,
        sku || null,
        photo || null,
        stock || 0,
      ],
    );

    const productId = (result as any).insertId;

    // Create variants if provided
    for (const variant of variants) {
      if (variant.size_id && variant.color_id) {
        await connection.execute(
          `INSERT INTO product_variants (product_id, size_id, color_id, stock, price_override, sku_variant) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            productId,
            variant.size_id,
            variant.color_id,
            variant.stock || 0,
            variant.price_override || null,
            variant.sku_variant || null,
          ],
        );
      }
    }

    // Associate with grades if provided
    for (const gradeId of grades) {
      await connection.execute(
        `INSERT IGNORE INTO product_grades (product_id, grade_id) VALUES (?, ?)`,
        [productId, gradeId],
      );
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

    res.status(201).json((productRows as any)[0]);
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

// Update product with variants
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
      photo,
      stock,
      active,
      variants = [],
      grades = [],
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    // Update the product
    await connection.execute(
      `UPDATE products SET 
         name = ?, description = ?, category_id = ?, base_price = ?, 
         suggested_price = ?, sku = ?, photo = ?, stock = ?, active = ?
       WHERE id = ?`,
      [
        name,
        description || null,
        category_id || null,
        base_price || null,
        suggested_price || null,
        sku || null,
        photo || null,
        stock || 0,
        active !== undefined ? active : true,
        req.params.id,
      ],
    );

    // Update variants - delete existing and create new ones
    await connection.execute(
      `DELETE FROM product_variants WHERE product_id = ?`,
      [req.params.id],
    );

    for (const variant of variants) {
      if (variant.size_id && variant.color_id) {
        await connection.execute(
          `INSERT INTO product_variants (product_id, size_id, color_id, stock, price_override, sku_variant) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            req.params.id,
            variant.size_id,
            variant.color_id,
            variant.stock || 0,
            variant.price_override || null,
            variant.sku_variant || null,
          ],
        );
      }
    }

    // Update grade associations
    await connection.execute(
      `DELETE FROM product_grades WHERE product_id = ?`,
      [req.params.id],
    );

    for (const gradeId of grades) {
      await connection.execute(
        `INSERT IGNORE INTO product_grades (product_id, grade_id) VALUES (?, ?)`,
        [req.params.id, gradeId],
      );
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

    res.json((productRows as any)[0]);
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

// Delete product and all variants
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

// Get product variants for a specific product
router.get("/:id/variants", async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT 
        pv.*,
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
    res.json(rows);
  } catch (error) {
    console.error("Error fetching product variants:", error);
    res.status(500).json({ error: "Failed to fetch product variants" });
  }
});

export { router as productsEnhancedRouter };
