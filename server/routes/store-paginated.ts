import { Router } from "express";
import db from "../lib/db";

const router = Router();

// Get all available products for the store with pagination
router.get("/products", async (req, res) => {
  try {
    // Parse query parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const category = req.query.category as string;
    const color = req.query.color as string;

    const offset = (page - 1) * limit;

    // Build WHERE clause for filters
    let whereConditions = ["p.active = true"];
    let queryParams: any[] = [];

    if (category && category !== "all") {
      whereConditions.push("c.id = ?");
      queryParams.push(category);
    }

    if (color && color !== "all") {
      whereConditions.push(`EXISTS (
        SELECT 1 FROM product_variants pv2 
        WHERE pv2.product_id = p.id AND pv2.color_id = ? AND pv2.stock > 0
      )`);
      queryParams.push(color);
    }

    const whereClause = whereConditions.join(" AND ");

    // Get total count for pagination
    const [countResult] = await db.execute(
      `
      SELECT COUNT(DISTINCT p.id) as total
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      WHERE ${whereClause} AND EXISTS (
        SELECT 1 FROM product_variants pv_stock 
        WHERE pv_stock.product_id = p.id AND pv_stock.stock > 0
      )
    `,
      queryParams,
    );

    const totalProducts = (countResult as any)[0].total;

    // Get paginated products
    const [products] = await db.execute(
      `
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
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      WHERE ${whereClause}
      GROUP BY p.id
      HAVING total_stock > 0
      ORDER BY p.name
      LIMIT ? OFFSET ?
    `,
      [...queryParams, limit, offset],
    );

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

export { router as storePaginatedRouter };
