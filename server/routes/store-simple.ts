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

        // For each product, get available colors based on viable grades
    const productsWithColors = [];
    for (const product of products as any[]) {
      // Get product info including sell_without_stock setting
      const [productInfo] = await db.execute(
        `SELECT sell_without_stock FROM products WHERE id = ?`,
        [product.id],
      );
      const productSettings = (productInfo as any)[0];

      // Get all available grades for this product
      const [gradeRows] = await db.execute(
        `SELECT DISTINCT
          g.id,
          g.name,
          c.name as color_name,
          c.hex_code,
          pcg.color_id,
          co.id as color_table_id,
          co.name as color_table_name,
          co.hex_code as color_table_hex
         FROM grade_vendida g
         INNER JOIN product_color_grades pcg ON g.id = pcg.grade_id
         INNER JOIN colors c ON pcg.color_id = c.id
         LEFT JOIN colors co ON c.id = co.id
         WHERE pcg.product_id = ? AND g.active = true`,
        [product.id],
      );

      const viableColors = new Set();

      // For each grade, check if it's viable
      for (const grade of gradeRows as any[]) {
        const [templateRows] = await db.execute(
          `SELECT gt.*, s.size, s.display_order
           FROM grade_templates gt
           LEFT JOIN sizes s ON gt.size_id = s.id
           WHERE gt.grade_id = ?
           ORDER BY s.display_order`,
          [grade.id],
        );

        let hasFullStock = true;

        // Check if all required variants have sufficient stock
        for (const template of templateRows as any[]) {
          const [variantRows] = await db.execute(
            `SELECT stock FROM product_variants
             WHERE product_id = ? AND size_id = ? AND color_id = ?`,
            [product.id, template.size_id, grade.color_id],
          );

          const variant = (variantRows as any)[0];
          if (!variant || variant.stock < template.required_quantity) {
            hasFullStock = false;
            break;
          }
        }

        // If sell without stock is enabled OR has full stock, color is viable
        if (productSettings.sell_without_stock || hasFullStock) {
          viableColors.add(JSON.stringify({
            id: grade.color_table_id,
            name: grade.color_table_name,
            hex_code: grade.color_table_hex,
          }));
        }
      }

      // If no grades exist, fall back to individual variant stock check
      if (gradeRows.length === 0) {
        const variantStockCondition = productSettings.sell_without_stock ? '' : 'AND pv.stock > 0';
        const [colorRows] = await db.execute(
          `SELECT DISTINCT
            co.id,
            co.name,
            co.hex_code
          FROM product_variants pv
          LEFT JOIN colors co ON pv.color_id = co.id
          WHERE pv.product_id = ? ${variantStockCondition} AND co.id IS NOT NULL
          ORDER BY co.name`,
          [product.id],
        );

        for (const color of colorRows as any[]) {
          viableColors.add(JSON.stringify(color));
        }
      }

      // Convert set back to array
      const availableColors = Array.from(viableColors).map(colorStr => JSON.parse(colorStr));

      productsWithColors.push({
        ...product,
        available_colors: availableColors,
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

// Get product details with variants and available grades
router.get("/products/:id", async (req, res) => {
  try {
    // Get product basic info including sell_without_stock setting
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

    // Get variants based on sell_without_stock setting
    const variantStockCondition = product.sell_without_stock ? '' : 'AND pv.stock > 0';
    const [variantRows] = await db.execute(
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

    // Get available grades for this product
    const [gradeRows] = await db.execute(
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

    product.variants = variantRows;
    product.available_grades = gradesWithTemplates;

    res.json(product);
  } catch (error) {
    console.error("Error fetching product details:", error);
    res.status(500).json({ error: "Failed to fetch product details" });
  }
});

// Get paginated products for the store with enhanced data (mobile compatible)
router.get("/products-paginated", async (req, res) => {
  try {
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

    // Get paginated products with photo field
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

    // For each product, get available colors based on viable grades
    const productsWithColors = [];
    for (const product of products as any[]) {
      // Get product info including sell_without_stock setting
      const [productInfo] = await db.execute(
        `SELECT sell_without_stock FROM products WHERE id = ?`,
        [product.id],
      );
      const productSettings = (productInfo as any)[0];

      // Get all available grades for this product
      const [gradeRows] = await db.execute(
        `SELECT DISTINCT
          g.id,
          g.name,
          c.name as color_name,
          c.hex_code,
          pcg.color_id,
          co.id as color_table_id,
          co.name as color_table_name,
          co.hex_code as color_table_hex
         FROM grade_vendida g
         INNER JOIN product_color_grades pcg ON g.id = pcg.grade_id
         INNER JOIN colors c ON pcg.color_id = c.id
         LEFT JOIN colors co ON c.id = co.id
         WHERE pcg.product_id = ? AND g.active = true`,
        [product.id],
      );

      const viableColors = new Set();

      // For each grade, check if it's viable
      for (const grade of gradeRows as any[]) {
        const [templateRows] = await db.execute(
          `SELECT gt.*, s.size, s.display_order
           FROM grade_templates gt
           LEFT JOIN sizes s ON gt.size_id = s.id
           WHERE gt.grade_id = ?
           ORDER BY s.display_order`,
          [grade.id],
        );

        let hasFullStock = true;

        // Check if all required variants have sufficient stock
        for (const template of templateRows as any[]) {
          const [variantRows] = await db.execute(
            `SELECT stock FROM product_variants
             WHERE product_id = ? AND size_id = ? AND color_id = ?`,
            [product.id, template.size_id, grade.color_id],
          );

          const variant = (variantRows as any)[0];
          if (!variant || variant.stock < template.required_quantity) {
            hasFullStock = false;
            break;
          }
        }

        // If sell without stock is enabled OR has full stock, color is viable
        if (productSettings.sell_without_stock || hasFullStock) {
          viableColors.add(JSON.stringify({
            id: grade.color_table_id,
            name: grade.color_table_name,
            hex_code: grade.color_table_hex,
          }));
        }
      }

      // If no grades exist, fall back to individual variant stock check
      if (gradeRows.length === 0) {
        const variantStockCondition = productSettings.sell_without_stock ? '' : 'AND pv.stock > 0';
        const [colorRows] = await db.execute(
          `SELECT DISTINCT
            co.id,
            co.name,
            co.hex_code
          FROM product_variants pv
          LEFT JOIN colors co ON pv.color_id = co.id
          WHERE pv.product_id = ? ${variantStockCondition} AND co.id IS NOT NULL
          ORDER BY co.name`,
          [product.id],
        );

        for (const color of colorRows as any[]) {
          viableColors.add(JSON.stringify(color));
        }
      }

      // Convert set back to array
      const availableColors = Array.from(viableColors).map(colorStr => JSON.parse(colorStr));

      productsWithColors.push({
        ...product,
        available_colors: availableColors,
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
    console.error("Error fetching paginated store products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

export { router as storeSimpleRouter };
