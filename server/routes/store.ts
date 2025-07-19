import { Router } from "express";
import db from "../lib/db";

const router = Router();

// Get all available products for the store
router.get("/products", async (req, res) => {
  try {
    const [products] = await db.execute(`
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
      WHERE p.active = true
      GROUP BY p.id
      HAVING total_stock > 0
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

    res.json(productsWithColors);
  } catch (error) {
    console.error("Error fetching store products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// Get product details with variants and available grades
router.get("/products/:id", async (req, res) => {
  try {
    // Get product basic info
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

    // Get available variants (with stock > 0)
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
       WHERE pv.product_id = ? AND pv.stock > 0
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

    // For each grade, get the template requirements
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

      // Check if all required variants are available with sufficient stock
      let available = true;
      let totalRequired = 0;
      for (const template of templateRows as any[]) {
        const variant = (variantRows as any[]).find(
          (v) =>
            v.size_id === template.size_id && v.color_id === grade.color_id,
        );
        if (!variant || variant.stock < template.required_quantity) {
          available = false;
          break;
        }
        totalRequired += template.required_quantity;
      }

      if (available) {
        gradesWithTemplates.push({
          ...grade,
          templates: templateRows,
          total_quantity: totalRequired,
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
      `INSERT INTO orders (customer_name, customer_phone, customer_email, total_price, status) VALUES (?, ?, ?, ?, ?)`,
      [
        customer.name,
        customer.whatsapp,
        customer.email,
        items.reduce((sum: number, item: any) => sum + item.totalPrice, 0),
        "pending",
      ],
    );

    const orderId = (orderResult as any).insertId;

    // Create order items and update stock - only grade purchases
    for (const item of items) {
      // Grade item - update multiple variant stocks based on template
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
            `Insufficient stock for ${item.productName} size ${template.size}`,
          );
        }

        // Update stock
        await connection.execute(
          `UPDATE product_variants SET stock = stock - ? WHERE product_id = ? AND size_id = ? AND color_id = ?`,
          [requiredQuantity, item.productId, template.size_id, item.colorId],
        );
      }

      // Create order item for the grade
      await connection.execute(
        `INSERT INTO order_items (order_id, product_id, color_id, grade_id, quantity, price) 
                  VALUES (?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          item.productId,
          item.colorId,
          item.gradeId,
          item.quantity,
          item.totalPrice,
        ],
      );
    }

    await connection.commit();

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
