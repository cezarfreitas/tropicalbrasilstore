import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import csv from "csv-parser";
import XLSX from "xlsx";
import axios from "axios";
import { promisify } from "util";
import { pipeline } from "stream";
import db from "../lib/db";

const router = Router();
const streamPipeline = promisify(pipeline);

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for large CSV files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [".csv", ".xlsx"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV and Excel files are allowed"));
    }
  },
});

// Store import progress in memory (in production, use Redis or database)
let importProgress = {
  total: 0,
  processed: 0,
  success: 0,
  errors: 0,
  current: "",
  isRunning: false,
  errorDetails: [] as Array<{
    row: number,
    productName: string,
    error: string
  }>,
};

// Parse CSV/Excel file
router.post("/parse-csv", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    let data: any[] = [];
    let headers: string[] = [];

    if (fileExtension === ".csv") {
      // Parse CSV
      await new Promise((resolve, reject) => {
        const results: any[] = [];
        fs.createReadStream(filePath)
          .pipe(csv())
          .on("headers", (headerList) => {
            headers = headerList;
          })
          .on("data", (data) => results.push(data))
          .on("end", () => {
            data = results;
            resolve(data);
          })
          .on("error", reject);
      });
    } else if (fileExtension === ".xlsx") {
      // Parse Excel
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length > 0) {
        headers = jsonData[0] as string[];
        data = jsonData.slice(1).map((row: any) => {
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = row[index] || "";
          });
          return obj;
        });
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    res.json({
      data: data.slice(0, 1000), // Limit to 1000 rows for initial processing
      headers,
      total: data.length,
    });
  } catch (error) {
    console.error("Error parsing file:", error);
    res.status(500).json({ error: "Failed to parse file" });
  }
});

// Download image from URL and save to public folder
async function downloadImage(
  url: string,
  filename: string,
): Promise<string | null> {
  try {
    const publicDir = path.join(process.cwd(), "public", "uploads", "products");

    // Create directory if it doesn't exist
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const ext = path.extname(url) || ".jpg";
    const safeName = filename.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const imagePath = path.join(publicDir, `${safeName}${ext}`);
    const publicPath = `/uploads/products/${safeName}${ext}`;

    const response = await axios({
      method: "GET",
      url: url,
      responseType: "stream",
      timeout: 30000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    await streamPipeline(response.data, fs.createWriteStream(imagePath));

    return publicPath;
  } catch (error) {
    console.error(`Error downloading image from ${url}:`, error);
    return null;
  }
}

// Process single color and ensure it exists in database
async function processColor(colorName: string): Promise<number> {
  if (!colorName || !colorName.trim()) {
    throw new Error("Color name is required");
  }

  const trimmedColor = colorName.trim();

  // Check if color exists
  const [existing] = await db.execute(
    "SELECT id FROM colors WHERE LOWER(name) = LOWER(?)",
    [trimmedColor],
  );

  let colorId: number;
  if ((existing as any[]).length > 0) {
    colorId = (existing as any[])[0].id;
  } else {
    // Create new color with default hex
    const [result] = await db.execute(
      "INSERT INTO colors (name, hex_code) VALUES (?, ?)",
      [trimmedColor, generateRandomHex()],
    );
    colorId = (result as any).insertId;
  }

  return colorId;
}

function generateRandomHex(): string {
  return (
    "#" +
    Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, "0")
  );
}

// Get available sizes for a size group
async function getSizesForGroup(sizeGroupId: number): Promise<any[]> {
  const [sizeGroup] = await db.execute(
    "SELECT sizes FROM size_groups WHERE id = ?",
    [sizeGroupId],
  );

  if ((sizeGroup as any[]).length === 0) {
    throw new Error(`Size group ${sizeGroupId} not found`);
  }

  const sizes = (sizeGroup as any[])[0].sizes;

  // Get size IDs from database
  const [sizeRows] = await db.execute(
    `SELECT id, size FROM sizes WHERE size IN (${sizes.map(() => "?").join(",")})`,
    sizes,
  );

  return sizeRows as any[];
}

// Import products
router.post("/products", async (req, res) => {
  try {
    const { data } = req.body;

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ error: "Invalid data format" });
    }

    // Reset progress
    importProgress = {
      total: data.length,
      processed: 0,
      success: 0,
      errors: 0,
      current: "",
      isRunning: true,
      errorDetails: [],
    };

    // Start processing in background
    processImport(data);

    res.json({ message: "Import started", total: data.length });
  } catch (error) {
    console.error("Error starting import:", error);
    res.status(500).json({ error: "Failed to start import" });
  }
});

async function processImport(data: any[]) {
  const connection = await db.getConnection();

  // Group data by product identifier (name + parent_sku or just name)
  const productGroups = new Map<string, any[]>();

  for (const item of data) {
    const productKey = item.parent_sku
      ? `${item.name}_${item.parent_sku}`
      : item.name;
    if (!productGroups.has(productKey)) {
      productGroups.set(productKey, []);
    }
    productGroups.get(productKey)!.push(item);
  }

  let processedItems = 0;

  for (const [productKey, productItems] of productGroups) {
    try {
      const firstItem = productItems[0];
      importProgress.current =
        firstItem.name || `Produto ${processedItems + 1}`;

      await connection.beginTransaction();

      // Validate required fields
      if (
        !firstItem.name ||
        !firstItem.category_id ||
        !firstItem.base_price ||
        !firstItem.size_group_id
      ) {
        throw new Error(
          "Missing required fields: name, category_id, base_price, size_group_id",
        );
      }

      // Check if product already exists (by name + parent_sku or just name)
      let productId: number;
      const searchKey = firstItem.parent_sku || firstItem.name;
      const searchField = firstItem.parent_sku ? "parent_sku" : "name";

      const [existingProduct] = await connection.execute(
        `SELECT id FROM products WHERE ${searchField} = ?`,
        [searchKey],
      );

      if ((existingProduct as any[]).length > 0) {
        productId = (existingProduct as any[])[0].id;

        // Delete existing variants to recreate them
        await connection.execute(
          "DELETE FROM product_variants WHERE product_id = ?",
          [productId],
        );

        // Update product info
        let photoPath = firstItem.photo_url
          ? await downloadImage(firstItem.photo_url, firstItem.name)
          : null;

        await connection.execute(
          `UPDATE products SET
           name = ?, description = ?, category_id = ?, base_price = ?,
           sale_price = ?, suggested_price = ?, sku = ?, photo = ?
           WHERE id = ?`,
          [
            firstItem.name,
            firstItem.description || null,
            parseInt(firstItem.category_id),
            parseFloat(firstItem.base_price),
            firstItem.sale_price ? parseFloat(firstItem.sale_price) : null,
            firstItem.suggested_price
              ? parseFloat(firstItem.suggested_price)
              : null,
            firstItem.sku || null,
            photoPath,
            productId,
          ],
        );
      } else {
        // Download image if URL provided
        let photoPath = null;
        if (firstItem.photo_url) {
          photoPath = await downloadImage(firstItem.photo_url, firstItem.name);
        }

        // Create new product
        const [productResult] = await connection.execute(
          `INSERT INTO products (
            name, description, category_id, base_price, sale_price, suggested_price,
            sku, parent_sku, photo, active
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            firstItem.name,
            firstItem.description || null,
            parseInt(firstItem.category_id),
            parseFloat(firstItem.base_price),
            firstItem.sale_price ? parseFloat(firstItem.sale_price) : null,
            firstItem.suggested_price
              ? parseFloat(firstItem.suggested_price)
              : null,
            firstItem.sku || null,
            firstItem.parent_sku || null,
            photoPath,
            true,
          ],
        );

        productId = (productResult as any).insertId;
      }

      // Get sizes for the group
      const sizes = await getSizesForGroup(parseInt(firstItem.size_group_id));
      if (sizes.length === 0) {
        throw new Error(
          `No sizes found for size group ${firstItem.size_group_id}`,
        );
      }

      // Process each color variation
      for (const item of productItems) {
        if (!item.color) {
          throw new Error("Color is required for each row");
        }

        // Process single color
        const colorId = await processColor(item.color);
        const stockPerVariant = parseInt(item.stock_per_variant) || 0;

        // Create variants for this color and all sizes
        for (const size of sizes) {
          await connection.execute(
            `INSERT INTO product_variants (product_id, size_id, color_id, stock)
             VALUES (?, ?, ?, ?)`,
            [productId, size.id, colorId, stockPerVariant],
          );
        }
      }

      await connection.commit();
      importProgress.success++;
      processedItems += productItems.length;
    } catch (error) {
      await connection.rollback();
      console.error(`Error processing product ${productKey}:`, error);

      // Store error details for each item in this group
      for (let i = 0; i < productItems.length; i++) {
        importProgress.errorDetails.push({
          row: processedItems + i + 1,
          productName: firstItem.name || `Produto ${processedItems + i + 1}`,
          error: error instanceof Error ? error.message : String(error)
        });
      }

      importProgress.errors += productItems.length;
      processedItems += productItems.length;
    }

    importProgress.processed = processedItems;
  }

  connection.release();
  importProgress.isRunning = false;
  importProgress.current = "";
}

// Get import progress
router.get("/progress", (req, res) => {
  res.json(importProgress);
});

// Reset import progress
router.post("/reset", (req, res) => {
  importProgress = {
    total: 0,
    processed: 0,
    success: 0,
    errors: 0,
    current: "",
    isRunning: false,
    errorDetails: [],
  };
  res.json({ message: "Progress reset" });
});

// Export products to CSV
router.get("/export-products", async (req, res) => {
  try {
    const filter = (req.query.filter as string) || "all";

    // Build WHERE clause based on filter
    let whereClause = "";
    if (filter === "active") {
      whereClause = "WHERE p.active = true";
    } else if (filter === "inactive") {
      whereClause = "WHERE p.active = false";
    }

    // Get all products with related data
    const [products] = await db.execute(`
      SELECT
        p.id,
        p.name,
        p.description,
        p.category_id,
        c.name as category_name,
        p.base_price,
        p.sale_price,
        p.suggested_price,
        p.sku,
        p.parent_sku,
        p.photo,
        p.active,
        p.created_at
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ORDER BY p.created_at DESC
    `);

    // For each product, create one row per color
    const exportData = [];

    for (const product of products as any[]) {
      // Get product colors
      const [colors] = await db.execute(
        `
        SELECT DISTINCT co.name, co.id
        FROM product_variants pv
        LEFT JOIN colors co ON pv.color_id = co.id
        WHERE pv.product_id = ? AND co.name IS NOT NULL
        ORDER BY co.name
      `,
        [product.id],
      );

      // Get size group (find the most common size group for this product)
      const [sizeGroupInfo] = await db.execute(
        `
        SELECT sg.id, sg.name, sg.sizes
        FROM product_variants pv
        LEFT JOIN sizes s ON pv.size_id = s.id
        LEFT JOIN size_groups sg ON JSON_CONTAINS(sg.sizes, JSON_QUOTE(s.size))
        WHERE pv.product_id = ? AND sg.id IS NOT NULL
        GROUP BY sg.id, sg.name, sg.sizes
        ORDER BY COUNT(*) DESC
        LIMIT 1
      `,
        [product.id],
      );

      const sizeGroupId =
        (sizeGroupInfo as any[]).length > 0
          ? (sizeGroupInfo as any[])[0].id
          : "";

      // Build photo URL (convert relative path to full URL if needed)
      let photoUrl = "";
      if (product.photo) {
        photoUrl = product.photo.startsWith("http")
          ? product.photo
          : `${req.protocol}://${req.get("host")}${product.photo}`;
      }

      // Create one row per color
      if ((colors as any[]).length === 0) {
        // Product without colors, create one row anyway
        exportData.push({
          "Nome do Produto": product.name || "",
          Categoria: product.category_id || "",
          "Preço Base": product.base_price || "",
          "Preço de Venda": product.sale_price || "",
          "URL da Foto": photoUrl,
          "Grupo de Tamanhos": sizeGroupId,
          "Cor (uma por linha)": "",
          SKU: product.sku || "",
          "SKU Pai": product.parent_sku || "",
          Descrição: product.description || "",
          "Preço Sugerido": product.suggested_price || "",
          "Estoque por Variante": 0,
        });
      } else {
        // Create one row per color
        for (const color of colors as any[]) {
          // Get average stock for this specific color
          const [stockInfo] = await db.execute(
            `
            SELECT AVG(stock) as avg_stock
            FROM product_variants
            WHERE product_id = ? AND color_id = ?
          `,
            [product.id, color.id],
          );

          const avgStock =
            (stockInfo as any[]).length > 0
              ? Math.round((stockInfo as any[])[0].avg_stock || 0)
              : 0;

          // Generate SKU for this color variation if original SKU exists
          let variantSku = product.sku || "";
          if (variantSku && color.name) {
            variantSku = `${variantSku}-${color.name.toUpperCase()}`;
          }

          exportData.push({
            "Nome do Produto": product.name || "",
            Categoria: product.category_id || "",
            "Preço Base": product.base_price || "",
            "Preço de Venda": product.sale_price || "",
            "URL da Foto": photoUrl,
            "Grupo de Tamanhos": sizeGroupId,
            "Cor (uma por linha)": color.name,
            SKU: variantSku,
            "SKU Pai": product.parent_sku || "",
            Descrição: product.description || "",
            "Preço Sugerido": product.suggested_price || "",
            "Estoque por Variante": avgStock,
          });
        }
      }
    }

    // Convert to CSV format
    if (exportData.length === 0) {
      return res.status(404).json({ error: "No products found to export" });
    }

    const headers = Object.keys(exportData[0]);
    const csvRows = [
      headers.join(","),
      ...exportData.map((row) =>
        headers
          .map((header) => {
            const value = row[header]?.toString() || "";
            // Escape commas and quotes in CSV
            return value.includes(",") || value.includes('"')
              ? `"${value.replace(/"/g, '""')}"`
              : value;
          })
          .join(","),
      ),
    ];

    const csvContent = csvRows.join("\n");

    // Set response headers for file download
    const filterSuffix =
      filter === "active"
        ? "_ativos"
        : filter === "inactive"
          ? "_inativos"
          : "";
    const filename = `produtos_exportados${filterSuffix}_${new Date().toISOString().split("T")[0]}.csv`;
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", Buffer.byteLength(csvContent, "utf8"));

    // Add BOM for proper UTF-8 encoding in Excel
    res.send("\ufeff" + csvContent);
  } catch (error) {
    console.error("Error exporting products:", error);
    res.status(500).json({ error: "Failed to export products" });
  }
});

// Get export statistics
router.get("/export-stats", async (req, res) => {
  try {
    const [stats] = await db.execute(`
      SELECT
        COUNT(*) as total_products,
        COUNT(CASE WHEN active = true THEN 1 END) as active_products,
        COUNT(CASE WHEN active = false THEN 1 END) as inactive_products
      FROM products
    `);

    res.json((stats as any[])[0]);
  } catch (error) {
    console.error("Error fetching export stats:", error);
    res.status(500).json({ error: "Failed to fetch export stats" });
  }
});

export { router as importRouter };
