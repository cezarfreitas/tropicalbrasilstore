import { Router } from "express";
import db from "../lib/db";
import { sendOrderNotifications } from "../lib/notification-service";

const router = Router();

// Get paginated products for the store with enhanced data
router.get("/products-paginated", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const searchTerm = req.query.busca as string;
    const offset = (page - 1) * limit;

    // Debug log
    console.log(
      `🔍 Search request - term: "${searchTerm}", page: ${page}, limit: ${limit}`,
    );

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM products p
      WHERE p.active = true
    `;

    const countParams: any[] = [];

    if (searchTerm && searchTerm.trim()) {
      countQuery += ` AND p.name LIKE ?`;
      countParams.push(`%${searchTerm.trim()}%`);
    }

    const [countResult] = await db.execute(countQuery, countParams);

    const totalProducts = (countResult as any)[0].total;
    const totalPages = Math.ceil(totalProducts / limit);

    // Debug: Check total products regardless of active status
    const [allProductsCount] = await db.execute('SELECT COUNT(*) as total FROM products');
    const [activeProductsCount] = await db.execute('SELECT COUNT(*) as total FROM products WHERE active = true');

    console.log(`📊 Products status: Total=${(allProductsCount as any[])[0].total}, Active=${(activeProductsCount as any[])[0].total}, Query result=${totalProducts}`);

    // Get paginated products with enhanced data (using inline values as workaround)
    let productsQuery = `
      SELECT
        p.id,
        p.name,
        p.description,
        p.base_price,
        p.active,
        p.photo,
        c.name as category_name,
        COUNT(DISTINCT pv.id) as variant_count,
        COALESCE(SUM(pv.stock), 0) as total_stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      WHERE p.active = true
    `;

    const productsParams: any[] = [];

    if (searchTerm && searchTerm.trim()) {
      productsQuery += ` AND p.name LIKE ?`;
      productsParams.push(`%${searchTerm.trim()}%`);
    }

    productsQuery += `
      GROUP BY p.id
      ORDER BY p.name
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [products] = await db.execute(productsQuery, productsParams);

    // Debug log
    console.log(
      `📊 Store API: found ${(products as any[]).length} products for search: "${searchTerm}"`,
    );

    // Debug each product's basic data
    (products as any[]).forEach((product, index) => {
      console.log(`📦 Product ${index + 1}: ${product.name} - photo: ${product.photo || 'null'}`);
    });

    // For each product, get available colors and variants
    const productsWithDetails = [];
    for (const product of products as any[]) {
      // Get available colors with stock info and images
      console.log(`🎨 Getting colors for product ${product.name} (ID: ${product.id})`);

      const [colorRows] = await db.execute(
        `
        SELECT DISTINCT
          co.id,
          co.name,
          co.hex_code,
          pcv.image_url
        FROM product_color_grades pcg
        LEFT JOIN colors co ON pcg.color_id = co.id
        LEFT JOIN product_color_variants pcv ON pcg.product_id = pcv.product_id AND pcg.color_id = pcv.color_id
        WHERE pcg.product_id = ? AND co.id IS NOT NULL
        GROUP BY co.id, co.name, co.hex_code, pcv.image_url
        ORDER BY co.name
      `,
        [product.id],
      );

      console.log(`🎨 Found ${(colorRows as any[]).length} colors for ${product.name}:`,
        (colorRows as any[]).map(c => ({ name: c.name, image_url: c.image_url }))
      );

      // Get available sizes with stock info
      const [sizeRows] = await db.execute(
        `
        SELECT DISTINCT
          s.id,
          s.size,
          s.display_order,
          COUNT(pv.id) as variant_count,
          SUM(pv.stock) as total_stock
        FROM product_variants pv
        LEFT JOIN sizes s ON pv.size_id = s.id
        WHERE pv.product_id = ? AND s.id IS NOT NULL
        GROUP BY s.id, s.size, s.display_order
        ORDER BY s.display_order
      `,
        [product.id],
      );

      // Determine main product image
      let mainImage = product.photo;

      // If no photo in products table, try to get from main variant or first available variant
      if (!mainImage && colorRows && colorRows.length > 0) {
        // First try to find the main catalog variant
        const [mainVariantRows] = await db.execute(
          `SELECT image_url FROM product_color_variants
           WHERE product_id = ? AND is_main_catalog = true AND image_url IS NOT NULL
           LIMIT 1`,
          [product.id],
        );

        if (mainVariantRows && (mainVariantRows as any[]).length > 0) {
          mainImage = (mainVariantRows as any[])[0].image_url;
        } else {
          // If no main variant, use first color with image
          const colorWithImage = (colorRows as any[]).find((c) => c.image_url);
          if (colorWithImage) {
            mainImage = colorWithImage.image_url;
          }
        }
      }

      console.log(
        `🖼️ Product ${product.name}: photo=${product.photo}, mainImage=${mainImage}, colors with images: ${(colorRows as any[]).filter((c) => c.image_url).length}`,
      );

      productsWithDetails.push({
        ...product,
        photo: mainImage, // Override with the determined main image
        available_colors: colorRows,
        available_sizes: sizeRows,
        price_range: {
          min: product.min_price,
          max: product.max_price,
        },
      });
    }

    res.json({
      products: productsWithDetails,
      pagination: {
        page,
        limit,
        total: totalProducts,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching paginated store products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
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

    // Add "all" category
    const allCategories = [
      {
        id: "all",
        name: "Todas as Categorias",
        description: "Ver todos os produtos",
      },
      ...categories,
    ];

    res.json(allCategories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// Get all available products for the store
router.get("/products", async (req, res) => {
  try {
    const [products] = await db.execute(`
      SELECT
        p.id,
        p.name,
        p.description,
        p.base_price,
        p.sell_without_stock,
        p.active,
        c.name as category_name,
        COUNT(DISTINCT pv.id) as variant_count,
        COALESCE(SUM(pv.stock), 0) as total_stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      WHERE p.active = true
      GROUP BY p.id
      ORDER BY p.name
    `);

    // For each product, get available colors
    const productsWithColors = [];
    for (const product of products as any[]) {
      const [colorRows] = await db.execute(
        `
        SELECT DISTINCT
          co.id,
          co.name,
          co.hex_code
        FROM product_color_grades pcg
        LEFT JOIN colors co ON pcg.color_id = co.id
        WHERE pcg.product_id = ? AND co.id IS NOT NULL
        ORDER BY co.name
      `,
        [product.id],
      );

      productsWithColors.push({
        ...product,
        available_colors: colorRows,
      });
    }

    res.json(productsWithColors);
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
    const variantStockCondition = product.sell_without_stock
      ? ""
      : "AND pv.stock > 0";
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

// Get grade details with requirements
router.get("/grades/:id", async (req, res) => {
  try {
    const [gradeRows] = await db.execute(
      `SELECT * FROM grade_vendida WHERE id = ? AND active = true`,
      [req.params.id],
    );

    if (gradeRows.length === 0) {
      return res.status(404).json({ error: "Grade not found" });
    }

    const grade = (gradeRows as any)[0];

    // Get template requirements
    const [templateRows] = await db.execute(
      `SELECT gt.*, s.size, s.display_order
       FROM grade_templates gt
       LEFT JOIN sizes s ON gt.size_id = s.id
       WHERE gt.grade_id = ?
       ORDER BY s.display_order`,
      [req.params.id],
    );

    grade.templates = templateRows;

    res.json(grade);
  } catch (error) {
    console.error("Error fetching grade details:", error);
    res.status(500).json({ error: "Failed to fetch grade details" });
  }
});

// Submit order - only grade purchases allowed
router.post("/orders", async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { customer, items } = req.body;

    if (!customer?.name || !customer?.email || !customer?.whatsapp) {
      return res
        .status(400)
        .json({ error: "Customer information is required" });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "No items in order" });
    }

    // Validate that all items are grades
    for (const item of items) {
      if (item.type !== "grade") {
        return res.status(400).json({
          error:
            "Only grade purchases are allowed. Individual purchases are not permitted.",
        });
      }
    }

    // Create customer record
    const [customerResult] = await connection.execute(
      `INSERT INTO customers (name, email, whatsapp) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), whatsapp = VALUES(whatsapp)`,
      [customer.name, customer.email, customer.whatsapp],
    );

    // Create order
    const [orderResult] = await connection.execute(
      `INSERT INTO orders (customer_email, total_amount, status) VALUES (?, ?, ?)`,
      [
        customer.email,
        items.reduce((sum: number, item: any) => sum + item.totalPrice, 0),
        "pending",
      ],
    );

    const orderId = (orderResult as any).insertId;

    // Validate stock before processing order
    for (const item of items) {
      // Get product info to check sell_without_stock setting
      const [productRows] = await connection.execute(
        `SELECT sell_without_stock FROM products WHERE id = ?`,
        [item.productId],
      );

      const productInfo = (productRows as any)[0];

      // If sell without stock is disabled, check stock availability
      if (!productInfo.sell_without_stock) {
        const [templateRows] = await connection.execute(
          `SELECT gt.*, s.size FROM grade_templates gt
           LEFT JOIN sizes s ON gt.size_id = s.id
           WHERE gt.grade_id = ?`,
          [item.gradeId],
        );

        for (const template of templateRows as any[]) {
          const requiredQuantity = template.required_quantity * item.quantity;

          // Check stock
          const [variantRows] = await connection.execute(
            `SELECT stock FROM product_variants WHERE product_id = ? AND size_id = ? AND color_id = ?`,
            [item.productId, template.size_id, item.colorId],
          );

          const variant = (variantRows as any)[0];
          if (!variant || variant.stock < requiredQuantity) {
            throw new Error(
              `Insufficient stock for ${item.productName} size ${template.size}. Required: ${requiredQuantity}, Available: ${variant?.stock || 0}`,
            );
          }
        }
      }
    }

    // Create order items and update stock - only grade purchases
    for (const item of items) {
      // Get product info to check sell_without_stock setting
      const [productRows] = await connection.execute(
        `SELECT sell_without_stock FROM products WHERE id = ?`,
        [item.productId],
      );

      const productInfo = (productRows as any)[0];

      // Grade item - update multiple variant stocks based on template
      const [templateRows] = await connection.execute(
        `SELECT gt.*, s.size FROM grade_templates gt
         LEFT JOIN sizes s ON gt.size_id = s.id
         WHERE gt.grade_id = ?`,
        [item.gradeId],
      );

      for (const template of templateRows as any[]) {
        const requiredQuantity = template.required_quantity * item.quantity;

        // Only update stock if sell_without_stock is disabled
        if (!productInfo.sell_without_stock) {
          // Update stock
          await connection.execute(
            `UPDATE product_variants SET stock = stock - ? WHERE product_id = ? AND size_id = ? AND color_id = ?`,
            [requiredQuantity, item.productId, template.size_id, item.colorId],
          );
        }
      }

      // Create order item for the grade
      await connection.execute(
        `INSERT INTO order_items (order_id, product_id, color_id, grade_id, quantity, unit_price, total_price, type)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          item.productId,
          item.colorId,
          item.gradeId,
          item.quantity,
          item.totalPrice / item.quantity, // unit_price
          item.totalPrice, // total_price
          "grade", // type
        ],
      );
    }

    await connection.commit();

    // Prepare notification data
    const totalPrice = items.reduce(
      (sum: number, item: any) => sum + item.totalPrice,
      0,
    );
    const notificationItems = items.map((item: any) => ({
      product_name: item.productName,
      color_name: item.colorName,
      grade_name: item.gradeName,
      quantity: item.quantity,
      price: item.totalPrice,
    }));

    // Send notifications asynchronously (don't wait for them)
    sendOrderNotifications({
      orderId: orderId.toString(),
      customerName: customer.name,
      customerEmail: customer.email,
      customerWhatsapp: customer.whatsapp,
      items: notificationItems,
      totalPrice: totalPrice,
      orderDate: new Date().toISOString(),
      status: "pending",
    }).catch((error) => {
      console.error("Failed to send notifications:", error);
    });

    res.status(201).json({
      orderId,
      message: "Order created successfully",
      whatsappMessage: generateWhatsAppMessage(customer, items, orderId),
    });
  } catch (error: any) {
    await connection.rollback();
    console.error("Error creating order:", error);
    res.status(500).json({ error: error.message || "Failed to create order" });
  } finally {
    connection.release();
  }
});

function generateWhatsAppMessage(
  customer: any,
  items: any[],
  orderId: number,
): string {
  let message = `🛍️ *Novo Pedido - #${orderId}*\n\n`;
  message += `👤 *Cliente:* ${customer.name}\n`;
  message += `📧 *Email:* ${customer.email}\n`;
  message += `📱 *WhatsApp:* ${customer.whatsapp}\n\n`;
  message += `📦 *Itens do Pedido:*\n`;

  items.forEach((item, index) => {
    message += `\n${index + 1}. *${item.productName}*\n`;
    message += `   • Grade: ${item.gradeName}\n`;
    message += `   • Cor: ${item.colorName}\n`;
    message += `   • Quantidade: ${item.quantity} kit(s)\n`;
    message += `   • Valor: R$ ${item.totalPrice.toFixed(2)}\n`;
  });

  const total = items.reduce((sum, item) => sum + item.totalPrice, 0);
  message += `\n💰 *Total: R$ ${total.toFixed(2)}*`;

  return encodeURIComponent(message);
}

export { router as storeRouter };
