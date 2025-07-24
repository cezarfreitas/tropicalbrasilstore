import { Router } from "express";
import db from "../lib/db";

const router = Router();

// Get store settings
router.get("/", async (req, res) => {
  try {
    const [settings] = await db.execute(`
      SELECT * FROM store_settings ORDER BY id LIMIT 1
    `);

    let storeSettings = (settings as any[])[0];

    // If no settings exist, create default settings
    if (!storeSettings) {
      const defaultSettings = {
        store_name: "Chinelos Store",
        store_description: "Loja especializada em chinelos de alta qualidade",
        contact_email: "contato@chinelos.com",
        contact_phone: "(11) 99999-9999",
        contact_whatsapp: "(11) 99999-9999",
        address: "Rua Principal, 123",
        city: "São Paulo",
        state: "SP",
        postal_code: "01234-567",
        shipping_fee: 15.0,
        free_shipping_threshold: 150.0,
        payment_methods: JSON.stringify(["pix", "credit_card", "debit_card"]),
        social_instagram: "@chinelos",
        social_facebook: "facebook.com/chinelos",
        logo_url: null,
        banner_url: null,
        maintenance_mode: false,
        allow_orders: true,
        tax_rate: 0.0,
        primary_color: "#f97316",
        secondary_color: "#ea580c",
        accent_color: "#fed7aa",
        background_color: "#ffffff",
        text_color: "#1f2937",
      };

      await db.execute(
        `
        INSERT INTO store_settings (
          store_name, store_description, contact_email, contact_phone, 
          contact_whatsapp, address, city, state, postal_code,
          shipping_fee, free_shipping_threshold, payment_methods,
          social_instagram, social_facebook, logo_url, banner_url,
          maintenance_mode, allow_orders, tax_rate, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `,
        [
          defaultSettings.store_name,
          defaultSettings.store_description,
          defaultSettings.contact_email,
          defaultSettings.contact_phone,
          defaultSettings.contact_whatsapp,
          defaultSettings.address,
          defaultSettings.city,
          defaultSettings.state,
          defaultSettings.postal_code,
          defaultSettings.shipping_fee,
          defaultSettings.free_shipping_threshold,
          defaultSettings.payment_methods,
          defaultSettings.social_instagram,
          defaultSettings.social_facebook,
          defaultSettings.logo_url,
          defaultSettings.banner_url,
          defaultSettings.maintenance_mode,
          defaultSettings.allow_orders,
          defaultSettings.tax_rate,
        ],
      );

      const [newSettings] = await db.execute(`
        SELECT * FROM store_settings ORDER BY id LIMIT 1
      `);
      storeSettings = (newSettings as any[])[0];
    }

    // Parse JSON fields
    if (storeSettings.payment_methods) {
      try {
        storeSettings.payment_methods = JSON.parse(
          storeSettings.payment_methods,
        );
      } catch (e) {
        storeSettings.payment_methods = ["pix", "credit_card"];
      }
    }

    res.json(storeSettings);
  } catch (error) {
    console.error("Error fetching store settings:", error);
    res.status(500).json({ error: "Failed to fetch store settings" });
  }
});

// Update store settings
router.patch("/", async (req, res) => {
  try {
    const {
      store_name,
      store_description,
      contact_email,
      contact_phone,
      contact_whatsapp,
      address,
      city,
      state,
      postal_code,
      shipping_fee,
      free_shipping_threshold,
      payment_methods,
      social_instagram,
      social_facebook,
      logo_url,
      banner_url,
      maintenance_mode,
      allow_orders,
      tax_rate,
    } = req.body;

    const updateFields = [];
    const updateValues = [];

    if (store_name !== undefined) {
      updateFields.push("store_name = ?");
      updateValues.push(store_name);
    }
    if (store_description !== undefined) {
      updateFields.push("store_description = ?");
      updateValues.push(store_description);
    }
    if (contact_email !== undefined) {
      updateFields.push("contact_email = ?");
      updateValues.push(contact_email);
    }
    if (contact_phone !== undefined) {
      updateFields.push("contact_phone = ?");
      updateValues.push(contact_phone);
    }
    if (contact_whatsapp !== undefined) {
      updateFields.push("contact_whatsapp = ?");
      updateValues.push(contact_whatsapp);
    }
    if (address !== undefined) {
      updateFields.push("address = ?");
      updateValues.push(address);
    }
    if (city !== undefined) {
      updateFields.push("city = ?");
      updateValues.push(city);
    }
    if (state !== undefined) {
      updateFields.push("state = ?");
      updateValues.push(state);
    }
    if (postal_code !== undefined) {
      updateFields.push("postal_code = ?");
      updateValues.push(postal_code);
    }
    if (shipping_fee !== undefined) {
      updateFields.push("shipping_fee = ?");
      updateValues.push(shipping_fee);
    }
    if (free_shipping_threshold !== undefined) {
      updateFields.push("free_shipping_threshold = ?");
      updateValues.push(free_shipping_threshold);
    }
    if (payment_methods !== undefined) {
      updateFields.push("payment_methods = ?");
      updateValues.push(JSON.stringify(payment_methods));
    }
    if (social_instagram !== undefined) {
      updateFields.push("social_instagram = ?");
      updateValues.push(social_instagram);
    }
    if (social_facebook !== undefined) {
      updateFields.push("social_facebook = ?");
      updateValues.push(social_facebook);
    }
    if (logo_url !== undefined) {
      updateFields.push("logo_url = ?");
      updateValues.push(logo_url);
    }
    if (banner_url !== undefined) {
      updateFields.push("banner_url = ?");
      updateValues.push(banner_url);
    }
    if (maintenance_mode !== undefined) {
      updateFields.push("maintenance_mode = ?");
      updateValues.push(maintenance_mode);
    }
    if (allow_orders !== undefined) {
      updateFields.push("allow_orders = ?");
      updateValues.push(allow_orders);
    }
    if (tax_rate !== undefined) {
      updateFields.push("tax_rate = ?");
      updateValues.push(tax_rate);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    updateFields.push("updated_at = NOW()");

    await db.execute(
      `
      UPDATE store_settings 
      SET ${updateFields.join(", ")}
      ORDER BY id LIMIT 1
    `,
      updateValues,
    );

    res.json({ message: "Store settings updated successfully" });
  } catch (error) {
    console.error("Error updating store settings:", error);
    res.status(500).json({ error: "Failed to update store settings" });
  }
});

// Backup database
router.post("/backup", async (req, res) => {
  try {
    // Get all tables data
    const tables = [
      "products",
      "categories",
      "sizes",
      "colors",
      "size_groups",
      "grade_vendida",
      "grade_templates",
      "product_color_grades",
      "product_variants",
      "store_settings",
      "customers",
      "orders",
      "order_items",
      "customer_auth",
    ];

    const backup: any = {
      timestamp: new Date().toISOString(),
      version: "1.0",
      tables: {},
    };

    for (const table of tables) {
      try {
        const [rows] = await db.execute(`SELECT * FROM ${table}`);
        backup.tables[table] = rows;
      } catch (error: any) {
        console.log(`Table ${table} not found or error:`, error.message);
        backup.tables[table] = [];
      }
    }

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="backup-${new Date().toISOString().split("T")[0]}.json"`,
    );
    res.json(backup);
  } catch (error) {
    console.error("Error creating backup:", error);
    res.status(500).json({ error: "Failed to create backup" });
  }
});

// Restore database (template creation)
router.post("/restore-template", async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Clear existing data (except customers and orders for safety)
    const tablesToClear = [
      "product_variants",
      "product_color_grades",
      "grade_templates",
      "grade_vendida",
      "products",
      "colors",
      "sizes",
      "categories",
      "size_groups",
    ];

    for (const table of tablesToClear) {
      try {
        await connection.execute(`DELETE FROM ${table}`);
        await connection.execute(`ALTER TABLE ${table} AUTO_INCREMENT = 1`);
      } catch (error: any) {
        console.log(`Could not clear table ${table}:`, error.message);
      }
    }

    // Create template data
    await createTemplateData(connection);

    await connection.commit();
    res.json({ message: "Template database created successfully" });
  } catch (error) {
    await connection.rollback();
    console.error("Error creating template database:", error);
    res.status(500).json({ error: "Failed to create template database" });
  } finally {
    connection.release();
  }
});

// Import backup data
router.post("/restore", async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { backup, preserveOrders = true } = req.body;

    if (!backup || !backup.tables) {
      return res.status(400).json({ error: "Invalid backup data" });
    }

    await connection.beginTransaction();

    // Tables to restore (excluding sensitive data if preserveOrders is true)
    const tablesToRestore = preserveOrders
      ? [
          "products",
          "categories",
          "sizes",
          "colors",
          "size_groups",
          "grade_vendida",
          "grade_templates",
          "product_color_grades",
          "product_variants",
          "store_settings",
        ]
      : Object.keys(backup.tables);

    for (const table of tablesToRestore) {
      if (!backup.tables[table]) continue;

      try {
        // Clear table data
        await connection.execute(`DELETE FROM ${table}`);
        await connection.execute(`ALTER TABLE ${table} AUTO_INCREMENT = 1`);

        // Insert backup data
        const data = backup.tables[table];
        if (data.length > 0) {
          const columns = Object.keys(data[0]);
          const placeholders = columns.map(() => "?").join(", ");
          const sql = `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`;

          for (const row of data) {
            const values = columns.map((col) => row[col]);
            await connection.execute(sql, values);
          }
        }
      } catch (error: any) {
        console.log(`Error restoring table ${table}:`, error.message);
      }
    }

    await connection.commit();
    res.json({ message: "Database restored successfully" });
  } catch (error) {
    await connection.rollback();
    console.error("Error restoring database:", error);
    res.status(500).json({ error: "Failed to restore database" });
  } finally {
    connection.release();
  }
});

async function createTemplateData(connection: any) {
  // Create basic categories
  await connection.execute(`
    INSERT INTO categories (name, description) VALUES
    ('Masculino', 'Chinelos masculinos'),
    ('Feminino', 'Chinelos femininos'),
    ('Infantil', 'Chinelos infantis'),
    ('Unissex', 'Chinelos unissex')
  `);

  // Create basic sizes
  await connection.execute(`
    INSERT INTO sizes (size, display_order) VALUES
    ('32', 1), ('33', 2), ('34', 3), ('35', 4), ('36', 5),
    ('37', 6), ('38', 7), ('39', 8), ('40', 9), ('41', 10),
    ('42', 11), ('43', 12), ('44', 13), ('45', 14)
  `);

  // Create basic colors
  await connection.execute(`
    INSERT INTO colors (name, hex_code) VALUES
    ('Preto', '#000000'),
    ('Branco', '#FFFFFF'),
    ('Azul Marinho', '#000080'),
    ('Vermelho', '#FF0000'),
    ('Rosa', '#FFC0CB'),
    ('Verde', '#008000'),
    ('Amarelo', '#FFFF00'),
    ('Cinza', '#808080')
  `);

  // Create sample products
  await connection.execute(`
    INSERT INTO products (name, description, base_price, category_id, active) VALUES
    ('Chinelo Clássico Masculino', 'Chinelo confortável para o dia a dia', 25.90, 1, true),
    ('Chinelo Feminino Delicado', 'Chinelo elegante para mulheres', 29.90, 2, true),
    ('Chinelo Infantil Colorido', 'Chinelo divertido para crianças', 19.90, 3, true)
  `);

  console.log("Template data created successfully");
}

// Configure multer for logo upload (outside of route handler)
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), "public", "uploads", "logos");
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log("📁 Created uploads directory:", uploadDir);
  }
} catch (error) {
  console.error("❌ Failed to create upload directory:", error);
}

const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => {
    cb(null, uploadDir);
  },
  filename: (req: any, file: any, cb: any) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `logo-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req: any, file: any, cb: any) => {
    // Check if file is an image
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
}).single("logo");

// Upload logo endpoint
router.post("/upload-logo", (req, res) => {
  upload(req, res, (err: any) => {
    if (err) {
      console.error("Upload error:", err);
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          error: "File too large. Maximum size is 5MB."
        });
      }
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Return the URL path for the uploaded logo
    const logoUrl = `/uploads/logos/${req.file.filename}`;

    console.log("✅ Logo uploaded successfully:", logoUrl);
    res.json({
      message: "Logo uploaded successfully",
      logo_url: logoUrl,
    });
  });
});

export { router as settingsRouter };
