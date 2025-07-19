import { Router } from "express";
import db from "../lib/db";

const router = Router();

// Get all available products for the store with simple pagination
router.get("/products", async (req, res) => {
  try {
    // Parse query parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const category = req.query.category as string;

    const offset = (page - 1) * limit;

    // Build base query
    let baseQuery = `
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      WHERE p.active = true
    `;

    let queryParams: any[] = [];

    // Add category filter if specified
    if (category && category !== "all") {
      baseQuery += ` AND c.id = ?`;
      queryParams.push(category);
    }

    baseQuery += `
      GROUP BY p.id, p.name, p.description, p.base_price, p.suggested_price, p.photo, p.active, c.name
      HAVING SUM(pv.stock) > 0
    `;

    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) as total FROM (SELECT p.id ${baseQuery}) as subquery`;
    const [countResult] = await db.execute(countQuery, queryParams);
    const totalProducts = (countResult as any)[0].total;

    // Get paginated products
    const productQuery = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.base_price,
        p.suggested_price,
        p.photo,
        p.active,
        c.name as category_name,
        COUNT(DISTINCT pv.id) as variant_count,
        SUM(pv.stock) as total_stock
      ${baseQuery}
      ORDER BY p.name
      LIMIT ? OFFSET ?
    `;

    const [products] = await db.execute(productQuery, [
      ...queryParams,
      limit,
      offset,
    ]);

    // For each product, get available colors
    const productsWithColors = [];
    for (const product of products as any[]) {
      const [colorRows] = await db.execute(
        `
        SELECT DISTINCT
          co.id,
          co.name,
          co.hex_code
        FROM product_variants pv
        LEFT JOIN colors co ON pv.color_id = co.id
        WHERE pv.product_id = ? AND pv.stock > 0 AND co.id IS NOT NULL
        ORDER BY co.name
      `,
        [product.id],
      );

      productsWithColors.push({
        ...product,
        available_colors: colorRows,
      });
    }

    // Return paginated response
    res.json({
      products: productsWithColors,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalProducts / limit),
        totalProducts,
        productsPerPage: limit,
        hasNextPage: page < Math.ceil(totalProducts / limit),
        hasPrevPage: page > 1,
      },
      total: totalProducts, // For backward compatibility
    });
  } catch (error) {
    console.error("Error fetching store products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

export { router as storeSimpleRouter };
