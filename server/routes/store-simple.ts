import { Router } from "express";
import db from "../lib/db";

const router = Router();

// Test endpoint to verify data
router.get("/test", async (req, res) => {
  try {
    const [products] = await db.execute(`
      SELECT p.id, p.name, p.photo, p.base_price
      FROM products p
      WHERE p.active = true
      LIMIT 5
    `);

    res.json({
      success: true,
      count: (products as any[]).length,
      products: products,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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
      GROUP BY p.id, p.name, p.description, p.base_price, p.suggested_price, p.photo, p.active, p.sell_without_stock, p.stock_type, c.name
      HAVING (
        CASE
          WHEN p.stock_type = 'size' THEN SUM(pv.stock) > 0
          WHEN p.stock_type = 'grade' THEN EXISTS(
            SELECT 1 FROM product_color_grades pcg
            INNER JOIN grade_vendida g ON pcg.grade_id = g.id
            WHERE pcg.product_id = p.id AND g.active = 1
          )
          ELSE FALSE
        END
      ) OR p.sell_without_stock = 1
    `;

    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) as total FROM (SELECT p.id ${baseQuery}) as subquery`;
    const [countResult] = await db.execute(countQuery, queryParams);
    const totalProducts = (countResult as any)[0].total;

    // Get paginated products (use interpolation for LIMIT/OFFSET as MySQL2 doesn't support them as parameters)
    const limitNum = parseInt(limit.toString());
    const offsetNum = parseInt(offset.toString());

    const productQuery = `
      SELECT
        p.id,
        p.name,
        p.description,
        p.base_price,
        p.suggested_price,
        p.photo,
        p.active,
        p.sell_without_stock,
        p.stock_type,
        c.name as category_name,
        COUNT(DISTINCT pv.id) as variant_count,
        SUM(pv.stock) as total_stock
      ${baseQuery}
      ORDER BY p.name
      LIMIT ${limitNum} OFFSET ${offsetNum}
    `;

    const [products] = await db.execute(productQuery, queryParams);

    // For each product, get available colors
    const productsWithColors = [];
    for (const product of products as any[]) {
      // Check if product has WooCommerce-style color variants first
      const [wooColorRows] = await db.execute(
        `
        SELECT DISTINCT
          co.id,
          co.name,
          co.hex_code,
          pcv.image_url
        FROM product_color_variants pcv
        LEFT JOIN colors co ON pcv.color_id = co.id
        WHERE pcv.product_id = ? AND pcv.active = true AND co.id IS NOT NULL
        ORDER BY co.name
      `,
        [product.id],
      );

      // Fallback to system based on stock type
      let colorRows = wooColorRows;
      if ((wooColorRows as any[]).length === 0) {
        if (product.stock_type === 'size') {
          // Estoque por tamanho: mostrar cores com estoque individual
          const [sizeColorRows] = await db.execute(
            `
            SELECT DISTINCT
              co.id,
              co.name,
              co.hex_code
            FROM product_variants pv
            LEFT JOIN colors co ON pv.color_id = co.id
            WHERE pv.product_id = ? AND (pv.stock > 0 OR ? = 1) AND co.id IS NOT NULL
            ORDER BY co.name
          `,
            [product.id, product.sell_without_stock],
          );
          colorRows = sizeColorRows;
        } else if (product.stock_type === 'grade') {
          // Estoque por grade: mostrar cores que têm grades ativas
          const [gradeColorRows] = await db.execute(
            `
            SELECT DISTINCT
              co.id,
              co.name,
              co.hex_code
            FROM product_color_grades pcg
            INNER JOIN colors co ON pcg.color_id = co.id
            INNER JOIN grade_vendida g ON pcg.grade_id = g.id
            WHERE pcg.product_id = ? AND g.active = 1 AND co.id IS NOT NULL
            ORDER BY co.name
          `,
            [product.id],
          );
          colorRows = gradeColorRows;
        }
      }

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

// Simple paginated products endpoint
router.get("/products-paginated", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const category = req.query.categoria as string;
    const searchTerm = req.query.busca as string;
    const colorFilter = req.query.cor
      ? parseInt(req.query.cor as string)
      : null;
    const genderFilter = req.query.genero
      ? parseInt(req.query.genero as string)
      : null;
    const typeFilter = req.query.tipo
      ? parseInt(req.query.tipo as string)
      : null;

    console.log(
      `Getting products - page: ${page}, limit: ${limit}, category: ${category || "all"}, search: "${searchTerm || "none"}", color: ${colorFilter || "none"}, gender: ${genderFilter || "none"}, type: ${typeFilter || "none"}"`,
    );

    const offset = (page - 1) * limit;

    // Simple query without complex joins initially
    let whereClause = "WHERE p.active = true";
    let queryParams: any[] = [];

    if (category && category !== "all") {
      whereClause +=
        " AND EXISTS (SELECT 1 FROM categories c WHERE c.id = p.category_id AND LOWER(c.name) = LOWER(?))";
      queryParams.push(category);
    }

    if (searchTerm && searchTerm.trim()) {
      whereClause += " AND p.name LIKE ?";
      queryParams.push(`%${searchTerm.trim()}%`);
    }

    // Add color filter if specified
    if (colorFilter !== null) {
      whereClause +=
        " AND EXISTS (SELECT 1 FROM product_color_grades pcg WHERE pcg.product_id = p.id AND pcg.color_id = ?)";
      queryParams.push(colorFilter);
    }

    // Add gender filter if specified
    if (genderFilter !== null) {
      whereClause += " AND p.gender_id = ?";
      queryParams.push(genderFilter);
    }

    // Add type filter if specified
    if (typeFilter !== null) {
      whereClause += " AND p.type_id = ?";
      queryParams.push(typeFilter);
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM products p 
      ${whereClause}
    `;

    const [countResult] = await db.execute(countQuery, queryParams);
    const totalProducts = (countResult as any)[0].total;

    // Get products with basic info (use interpolation for LIMIT/OFFSET)
    const limitNum = parseInt(limit.toString());
    const offsetNum = parseInt(offset.toString());

    const productsQuery = `
      SELECT
        p.id,
        p.name,
        p.description,
        p.base_price,
        p.suggested_price,
        p.photo,
        p.active,
        p.sell_without_stock,
        p.stock_type,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
      AND (
        CASE
          WHEN p.stock_type = 'size' THEN EXISTS(
            SELECT 1 FROM product_variants pv
            WHERE pv.product_id = p.id AND (pv.stock > 0 OR p.sell_without_stock = 1)
          )
          WHEN p.stock_type = 'grade' THEN EXISTS(
            SELECT 1 FROM product_color_grades pcg
            INNER JOIN grade_vendida g ON pcg.grade_id = g.id
            WHERE pcg.product_id = p.id AND (g.active = 1 OR p.sell_without_stock = 1)
          )
          ELSE FALSE
        END
      )
      ORDER BY p.name
      LIMIT ${limitNum} OFFSET ${offsetNum}
    `;

    const [products] = await db.execute(productsQuery, queryParams);

    console.log(`Found ${(products as any[]).length} products`);

    // Add color data and availability based on stock type
    const productsWithData = [];
    for (const product of products as any[]) {
      let available_colors = [];
      let available_grades_count = 0;

      if (product.stock_type === 'grade') {
        // Para produtos com estoque por grade
        const [gradeColors] = await db.execute(
          `SELECT DISTINCT
            co.id,
            co.name,
            co.hex_code
          FROM product_color_grades pcg
          INNER JOIN colors co ON pcg.color_id = co.id
          INNER JOIN grade_vendida g ON pcg.grade_id = g.id
          WHERE pcg.product_id = ? AND g.active = 1
          ORDER BY co.name`,
          [product.id],
        );
        available_colors = gradeColors;

        // Contar grades disponíveis
        const [availableGrades] = await db.execute(
          `SELECT COUNT(*) as available_count
          FROM product_color_grades pcg
          INNER JOIN grade_vendida gv ON pcg.grade_id = gv.id
          WHERE pcg.product_id = ? AND gv.active = 1`,
          [product.id],
        );
        available_grades_count = (availableGrades as any)[0].available_count;

      } else if (product.stock_type === 'size') {
        // Para produtos com estoque por tamanho
        const [sizeColors] = await db.execute(
          `SELECT DISTINCT
            co.id,
            co.name,
            co.hex_code
          FROM product_variants pv
          INNER JOIN colors co ON pv.color_id = co.id
          WHERE pv.product_id = ? AND (pv.stock > 0 OR ? = 1)
          ORDER BY co.name`,
          [product.id, product.sell_without_stock],
        );
        available_colors = sizeColors;
      }

      // Get variant count and stock info
      const [stockInfo] = await db.execute(
        `SELECT
          COUNT(DISTINCT pv.id) as variant_count,
          COALESCE(SUM(pv.stock), 0) as total_stock
        FROM product_variants pv
        WHERE pv.product_id = ?`,
        [product.id],
      );

      const stockData = (stockInfo as any[])[0] || {
        variant_count: 0,
        total_stock: 0,
      };

      productsWithData.push({
        ...product,
        available_colors: available_colors || [],
        variant_count: stockData.variant_count,
        total_stock: stockData.total_stock,
        available_grades_count: available_grades_count,
        stock_type: product.stock_type,
      });
    }

    res.json({
      products: productsWithData,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalProducts / limit),
        totalProducts,
        productsPerPage: limit,
        hasNextPage: page < Math.ceil(totalProducts / limit),
        hasPrevPage: page > 1,
      },
      total: totalProducts,
    });
  } catch (error) {
    console.error("Error fetching paginated products:", error);
    res.status(500).json({
      error: "Failed to fetch products",
      details: error.message,
    });
  }
});

// Get product details with variants and available grades
router.get("/products/:id", async (req, res) => {
  try {
    // Get product basic info including stock settings
    const [productRows] = await db.execute(
      `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ? AND p.active = true`,
      [req.params.id],
    );

    if (productRows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    const product = (productRows as any)[0];

    // Try to get WooCommerce-style color variants first
    const stockCondition = product.sell_without_stock
      ? ""
      : "AND pcv.stock_total > 0";
    const [wooVariantRows] = await db.execute(
      `SELECT
        pcv.id,
        pcv.color_id,
        pcv.stock_total as stock,
        pcv.price,
        pcv.sale_price,
        pcv.image_url,
        c.name as color_name,
        c.hex_code
       FROM product_color_variants pcv
       LEFT JOIN colors c ON pcv.color_id = c.id
       WHERE pcv.product_id = ? AND pcv.active = true ${stockCondition}
       ORDER BY c.name`,
      [req.params.id],
    );

    // Get variants based on stock type
    let variantRows = wooVariantRows;
    if ((wooVariantRows as any[]).length === 0) {
      if (product.stock_type === 'size') {
        // Para estoque por tamanho: mostrar variantes individuais
        const variantStockCondition = product.sell_without_stock
          ? ""
          : "AND pv.stock > 0";
        const [sizeVariantRows] = await db.execute(
          `SELECT
            pv.id,
            pv.size_id,
            pv.color_id,
            pv.stock,
            COALESCE(pv.price_override, 0) as price_override,
            s.size,
            s.display_order,
            c.name as color_name,
            c.hex_code
           FROM product_variants pv
           LEFT JOIN sizes s ON pv.size_id = s.id
           LEFT JOIN colors c ON pv.color_id = c.id
           WHERE pv.product_id = ? ${variantStockCondition}
           ORDER BY s.display_order, c.name`,
          [req.params.id],
        );
        variantRows = sizeVariantRows;
      } else {
        // Para estoque por grade: não mostrar variantes individuais
        variantRows = [];
      }
    }

    // Get available grades only for grade-based stock products
    let gradeRows = [];
    if (product.stock_type === 'grade') {
      const [grades] = await db.execute(
        `SELECT DISTINCT
          g.id,
          g.name,
          g.description,
          c.name as color_name,
          c.hex_code,
          pcg.color_id
         FROM grade_vendida g
         INNER JOIN product_color_grades pcg ON g.id = pcg.grade_id
         INNER JOIN colors c ON pcg.color_id = c.id
         WHERE pcg.product_id = ? AND g.active = true`,
        [req.params.id],
      );
      gradeRows = grades;
    }

    // For each grade, get the template requirements and check stock availability
    const gradesWithTemplates = [];
    for (const grade of gradeRows as any[]) {
      const [templateRows] = await db.execute(
        `SELECT gt.*, s.size, s.display_order
         FROM grade_templates gt
         LEFT JOIN sizes s ON gt.size_id = s.id
         WHERE gt.grade_id = ?
         ORDER BY s.display_order`,
        [grade.id],
      );

      // Calculate total required and check stock availability
      let totalRequired = 0;
      let hasFullStock = true;
      let hasAnyStock = false;

      for (const template of templateRows as any[]) {
        totalRequired += template.required_quantity;

        // Check if variant exists and has sufficient stock
        const variant = (variantRows as any[]).find(
          (v) =>
            v.size_id === template.size_id && v.color_id === grade.color_id,
        );

        if (variant) {
          if (variant.stock > 0) {
            hasAnyStock = true;
          }
          if (variant.stock < template.required_quantity) {
            hasFullStock = false;
          }
        } else {
          hasFullStock = false;
        }
      }

      // Determine if grade should be shown based on sell_without_stock setting
      let shouldShowGrade = false;

      if (product.sell_without_stock) {
        // If sell without stock is enabled, show grade regardless of stock
        shouldShowGrade = totalRequired > 0;
      } else {
        // If sell without stock is disabled, only show grade if there's sufficient stock
        shouldShowGrade = hasFullStock && totalRequired > 0;
      }

      if (shouldShowGrade) {
        gradesWithTemplates.push({
          ...grade,
          templates: templateRows,
          total_quantity: totalRequired,
          has_full_stock: hasFullStock,
          has_any_stock: hasAnyStock,
        });
      }
    }

    // Extract unique colors for the available_colors field
    const uniqueColors = [];
    const seenColorIds = new Set();

    for (const variant of variantRows as any[]) {
      if (variant.color_id && !seenColorIds.has(variant.color_id)) {
        seenColorIds.add(variant.color_id);
        uniqueColors.push({
          id: variant.color_id,
          name: variant.color_name,
          hex_code: variant.hex_code,
          image_url: variant.image_url,
        });
      }
    }

    product.variants = variantRows;
    product.available_colors = uniqueColors;
    product.available_grades = gradesWithTemplates;

    res.json(product);
  } catch (error) {
    console.error("Error fetching product details:", error);
    res.status(500).json({ error: "Failed to fetch product details" });
  }
});

// Get categories for store filtering
router.get("/categories", async (req, res) => {
  try {
    const [categories] = await db.execute(`
      SELECT DISTINCT
        c.id,
        c.name,
        c.description
      FROM categories c
      INNER JOIN products p ON c.id = p.category_id
      WHERE p.active = true
      ORDER BY c.name
    `);

    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

export { router as storeSimpleRouter };
