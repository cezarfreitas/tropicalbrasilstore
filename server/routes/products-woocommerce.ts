import { Router } from "express";
import db from "../lib/db";
import { ensureLocalImageUrl } from "../lib/image-uploader";

const router = Router();

interface ColorVariant {
  id?: number;
  color_id: number;
  variant_name: string;
  variant_sku?: string;
  price?: number;
  sale_price?: number;
  image_url?: string;
  images?: string[]; // Array de até 5 imagens
  stock_total: number;
  active: boolean;
  is_main_catalog?: boolean;
  grade_ids: number[];
  size_stocks: SizeStock[];
}

interface SizeStock {
  size_id: number;
  stock: number;
}

interface WooCommerceProduct {
  id?: number;
  name: string;
  description?: string;
  category_id?: number;
  brand_id?: number;
  base_price?: number;
  suggested_price?: number;
  sku?: string;
  parent_sku?: string;
  active?: boolean;
  sell_without_stock?: boolean;
  size_group_id?: number;
  stock_type?: "size" | "grade";
  color_variants: ColorVariant[];
}

// Get all products with color variants (WooCommerce style)
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const search = (req.query.search as string) || "";
    const category = (req.query.category as string) || "";
    const brand = (req.query.brand as string) || "";
    const status = (req.query.status as string) || "";

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
      params.push(category);
    }

    if (brand) {
      conditions.push("p.brand_id = ?");
      params.push(brand);
    }

    if (status === "active") {
      conditions.push("p.active = true");
    } else if (status === "inactive") {
      conditions.push("p.active = false");
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Get total count
    const countQuery = `SELECT COUNT(DISTINCT p.id) as total FROM products p ${whereClause}`;
    const [countResult] = await db.execute(countQuery, params);
    const total = (countResult as any)[0].total;

    // Get products with color variant summary
    const query = `
      SELECT
        p.*,
        c.name as category_name,
        b.name as brand_name,
        COUNT(DISTINCT pcv.id) as variant_count,
        CASE
          WHEN p.stock_type = 'grade' THEN COALESCE(SUM(DISTINCT pcg.stock_quantity), 0)
          ELSE COALESCE(SUM(pcv.stock_total), 0)
        END as total_stock,
        COUNT(DISTINCT pcg.grade_id) as grade_count,
        GROUP_CONCAT(DISTINCT co.name ORDER BY co.name) as available_colors,
        GROUP_CONCAT(DISTINCT CONCAT(co.name, ':', co.hex_code) ORDER BY co.name) as color_data
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN product_color_variants pcv ON p.id = pcv.product_id
      LEFT JOIN colors co ON pcv.color_id = co.id
      LEFT JOIN product_color_grades pcg ON p.id = pcg.product_id
      ${whereClause}
      GROUP BY p.id, c.name, b.name
      ORDER BY p.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [rows] = await db.execute(query, params);
    const products = rows as any[];

    // For each product, get its color variants with images
    for (const product of products) {
      const [variantRows] = await db.execute(
        `SELECT
          pcv.*,
          c.name as color_name,
          c.hex_code
         FROM product_color_variants pcv
         LEFT JOIN colors c ON pcv.color_id = c.id
         WHERE pcv.product_id = ?
         ORDER BY c.name`,
        [product.id],
      );

      // Convert image_url to images array for consistency and ensure local URLs
      product.color_variants = (variantRows as any[]).map((variant) => {
        const localImageUrl = ensureLocalImageUrl(variant.image_url);
        const images =
          variant.images || (localImageUrl ? [localImageUrl] : []);
        console.log(
          `🖼️ Product ${product.name} - Variant ${variant.color_name}: image_url=${localImageUrl}, images=[${images.join(", ")}]`,
        );
        return {
          ...variant,
          image_url: localImageUrl,
          images: images,
        };
      });

      if (product.color_variants.length === 0) {
        console.log(`⚠️ Product ${product.name} has no color variants!`);
      }
    }

    res.json({
      data: products,
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
    console.error("Error fetching WooCommerce products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// Get product by ID with all color variants and size stocks
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

    // Get color variants
    const [variantRows] = await db.execute(
      `SELECT 
        pcv.*,
        c.name as color_name,
        c.hex_code
       FROM product_color_variants pcv
       LEFT JOIN colors c ON pcv.color_id = c.id
       WHERE pcv.product_id = ?
       ORDER BY c.name`,
      [req.params.id],
    );

    // Get size stocks and grades for each variant
    for (const variant of variantRows as any[]) {
      const [sizeStocks] = await db.execute(
        `SELECT
          pvs.*,
          s.size,
          s.display_order
         FROM product_variant_sizes pvs
         LEFT JOIN sizes s ON pvs.size_id = s.id
         WHERE pvs.color_variant_id = ?
         ORDER BY s.display_order`,
        [variant.id],
      );
      variant.size_stocks = sizeStocks;

      // Get grades for this product-color combination with stock quantities
      const [gradeRows] = await db.execute(
        `SELECT pcg.grade_id, pcg.stock_quantity, gv.name as grade_name
         FROM product_color_grades pcg
         LEFT JOIN grade_vendida gv ON pcg.grade_id = gv.id
         WHERE pcg.product_id = ? AND pcg.color_id = ?`,
        [req.params.id, variant.color_id],
      );
      variant.grade_ids = (gradeRows as any[]).map((row) => row.grade_id);
      variant.grade_stocks = gradeRows; // Include full grade info with stock quantities

      // Get images for this variant
      const [imageRows] = await db.execute(
        `SELECT image_url FROM variant_images
         WHERE color_variant_id = ?
         ORDER BY display_order`,
        [variant.id],
      );
      variant.images = (imageRows as any[]).map((row) => row.image_url);
    }

    product.color_variants = variantRows;
    product.variant_count = (variantRows as any[]).length;
    product.total_stock = (variantRows as any[]).reduce(
      (sum, variant) => sum + (variant.stock_total || 0),
      0,
    );

    res.json(product);
  } catch (error) {
    console.error("Error fetching WooCommerce product:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// Create product with color variants (WooCommerce style)
router.post("/", async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const {
      name,
      description,
      category_id,
      brand_id,
      base_price,
      suggested_price,
      sku,
      parent_sku,
      photo,
      active = true,
      sell_without_stock = false,
      size_group_id,
      color_variants,
    }: WooCommerceProduct = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    // Create main product
    const [productResult] = await connection.execute(
      `INSERT INTO products (
        name, description, category_id, brand_id, base_price, suggested_price,
        sku, parent_sku, photo, active, sell_without_stock, stock_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        description || null,
        category_id || null,
        brand_id || null,
        base_price || null,
        suggested_price || null,
        sku || null,
        parent_sku || null,
        photo || null,
        active,
        sell_without_stock,
        (req.body as WooCommerceProduct).stock_type || "grade",
      ],
    );

    const productId = (productResult as any).insertId;

    // Create color variants if provided
    if (color_variants && color_variants.length > 0) {
      for (const variant of color_variants) {
        if (variant.color_id) {
          // Create color variant
          const [variantResult] = await connection.execute(
            `INSERT INTO product_color_variants
             (product_id, color_id, variant_name, variant_sku, price, sale_price, image_url, stock_total, active, is_main_catalog)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              productId,
              variant.color_id,
              variant.variant_name,
              variant.variant_sku || null,
              variant.price || null,
              variant.sale_price || null,
              variant.image_url || null,
              variant.stock_total || 0,
              variant.active !== false,
              variant.is_main_catalog || false,
            ],
          );

          const colorVariantId = (variantResult as any).insertId;

          // Create size stocks for this color variant
          if (variant.size_stocks && variant.size_stocks.length > 0) {
            for (const sizeStock of variant.size_stocks) {
              await connection.execute(
                `INSERT INTO product_variant_sizes (color_variant_id, size_id, stock)
                 VALUES (?, ?, ?)`,
                [colorVariantId, sizeStock.size_id, sizeStock.stock || 0],
              );
            }
          }

          // Associate grades with this product-color combination
          if (variant.grade_ids && variant.grade_ids.length > 0) {
            for (const gradeId of variant.grade_ids) {
              await connection.execute(
                `INSERT IGNORE INTO product_color_grades (product_id, color_id, grade_id)
                 VALUES (?, ?, ?)`,
                [productId, variant.color_id, gradeId],
              );
            }
          }

          // Save variant images
          if (variant.images && variant.images.length > 0) {
            for (let i = 0; i < variant.images.length; i++) {
              await connection.execute(
                `INSERT INTO variant_images (color_variant_id, image_url, display_order)
                 VALUES (?, ?, ?)`,
                [colorVariantId, variant.images[i], i],
              );
            }
          }
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

    res.status(201).json((productRows as any)[0]);
  } catch (error: any) {
    await connection.rollback();
    console.error("Error creating WooCommerce product:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "SKU already exists" });
    }
    res.status(500).json({ error: "Failed to create product" });
  } finally {
    connection.release();
  }
});

// Update product with color variants
router.put("/:id", async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const {
      name,
      description,
      category_id,
      brand_id,
      base_price,
      suggested_price,
      sku,
      parent_sku,
      photo,
      active,
      sell_without_stock,
      color_variants,
    }: WooCommerceProduct & { active?: boolean; sell_without_stock?: boolean } =
      req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    // Update main product
    await connection.execute(
      `UPDATE products SET
       name = ?, description = ?, category_id = ?, brand_id = ?, base_price = ?, suggested_price = ?,
       sku = ?, parent_sku = ?, photo = ?, active = ?, sell_without_stock = ?, stock_type = ?
       WHERE id = ?`,
      [
        name,
        description || null,
        category_id || null,
        brand_id || null,
        base_price || null,
        suggested_price || null,
        sku || null,
        parent_sku || null,
        photo || null,
        active !== false,
        sell_without_stock || false,
        (req.body as WooCommerceProduct).stock_type || "grade",
        req.params.id,
      ],
    );

    // Delete existing variant images, color variants, size stocks, and grades
    await connection.execute(
      "DELETE FROM variant_images WHERE color_variant_id IN (SELECT id FROM product_color_variants WHERE product_id = ?)",
      [req.params.id],
    );
    await connection.execute(
      "DELETE FROM product_color_variants WHERE product_id = ?",
      [req.params.id],
    );
    await connection.execute(
      "DELETE FROM product_color_grades WHERE product_id = ?",
      [req.params.id],
    );

    // Create new color variants
    if (color_variants && color_variants.length > 0) {
      for (const variant of color_variants) {
        if (variant.color_id) {
          // Create color variant
          const [variantResult] = await connection.execute(
            `INSERT INTO product_color_variants
             (product_id, color_id, variant_name, variant_sku, price, sale_price, image_url, stock_total, active, is_main_catalog)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              req.params.id,
              variant.color_id,
              variant.variant_name,
              variant.variant_sku || null,
              variant.price || null,
              variant.sale_price || null,
              variant.image_url || null,
              variant.stock_total || 0,
              variant.active !== false,
              variant.is_main_catalog || false,
            ],
          );

          const colorVariantId = (variantResult as any).insertId;

          // Create size stocks for this color variant
          if (variant.size_stocks && variant.size_stocks.length > 0) {
            for (const sizeStock of variant.size_stocks) {
              await connection.execute(
                `INSERT INTO product_variant_sizes (color_variant_id, size_id, stock)
                 VALUES (?, ?, ?)`,
                [colorVariantId, sizeStock.size_id, sizeStock.stock || 0],
              );
            }
          }

          // Handle grade stocks - save the actual stock quantities for each grade
          if (variant.grade_stocks && variant.grade_stocks.length > 0) {
            for (const gradeStock of variant.grade_stocks) {
              await connection.execute(
                `INSERT INTO product_color_grades (product_id, color_id, grade_id, stock_quantity)
                 VALUES (?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE stock_quantity = VALUES(stock_quantity)`,
                [req.params.id, variant.color_id, gradeStock.grade_id, gradeStock.stock_quantity || 0],
              );
            }
          }

          // Also handle legacy grade_ids (for backward compatibility)
          if (variant.grade_ids && variant.grade_ids.length > 0) {
            for (const gradeId of variant.grade_ids) {
              // Only insert if not already handled by grade_stocks above
              const existingStock = variant.grade_stocks?.find(gs => gs.grade_id === gradeId);
              if (!existingStock) {
                await connection.execute(
                  `INSERT IGNORE INTO product_color_grades (product_id, color_id, grade_id, stock_quantity)
                   VALUES (?, ?, ?, 0)`,
                  [req.params.id, variant.color_id, gradeId],
                );
              }
            }
          }

          // Save variant images
          if (variant.images && variant.images.length > 0) {
            for (let i = 0; i < variant.images.length; i++) {
              await connection.execute(
                `INSERT INTO variant_images (color_variant_id, image_url, display_order)
                 VALUES (?, ?, ?)`,
                [colorVariantId, variant.images[i], i],
              );
            }
          }
        }
      }
    }

    await connection.commit();

    res.json({ message: "Product updated successfully" });
  } catch (error: any) {
    await connection.rollback();
    console.error("Error updating WooCommerce product:", error);
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

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

export { router as productsWooCommerceRouter };
