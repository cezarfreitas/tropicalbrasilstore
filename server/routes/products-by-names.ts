import { Router } from "express";
import db from "../lib/db";
import axios from "axios";
import path from "path";
import fs from "fs";
import { promisify } from "util";
import { pipeline } from "stream";

const router = Router();
const streamPipeline = promisify(pipeline);

// Download image from URL and save to public folder
async function downloadImage(url: string, filename: string): Promise<string | null> {
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
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    await streamPipeline(response.data, fs.createWriteStream(imagePath));

    return publicPath;
  } catch (error) {
    console.error(`Error downloading image from ${url}:`, error);
    return null;
  }
}

interface ProductByNamesRequest {
  name: string;
  description?: string;
  category_name?: string;
  base_price?: number;
  sale_price?: number;
  suggested_price?: number;
  sku?: string;
  parent_sku?: string;
  parent_id?: number; // ID do produto pai para hierarquia
  photo?: string; // Caminho local da foto principal
  photo_url?: string; // URL externa para download automático
  variants: {
    size_name: string;
    color_name: string;
    stock: number;
    price_override?: number;
  }[];
  size_group_name?: string;
}

// Helper function to get or create category
async function getOrCreateCategory(connection: any, categoryName: string): Promise<number> {
  if (!categoryName) {
    throw new Error("Category name is required");
  }

  // Check if category exists
  const [existing] = await connection.execute(
    "SELECT id FROM categories WHERE LOWER(name) = LOWER(?)",
    [categoryName.trim()]
  );

  if ((existing as any[]).length > 0) {
    return (existing as any[])[0].id;
  }

  // Create new category
  const [result] = await connection.execute(
    "INSERT INTO categories (name) VALUES (?)",
    [categoryName.trim()]
  );

  return (result as any).insertId;
}

// Helper function to get or create color
async function getOrCreateColor(connection: any, colorName: string): Promise<number> {
  if (!colorName) {
    throw new Error("Color name is required");
  }

  // Check if color exists
  const [existing] = await connection.execute(
    "SELECT id FROM colors WHERE LOWER(name) = LOWER(?)",
    [colorName.trim()]
  );

  if ((existing as any[]).length > 0) {
    return (existing as any[])[0].id;
  }

  // Generate random hex color
  const randomHex = "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");

  // Create new color
  const [result] = await connection.execute(
    "INSERT INTO colors (name, hex_code) VALUES (?, ?)",
    [colorName.trim(), randomHex]
  );

  return (result as any).insertId;
}

// Helper function to get or create size
async function getOrCreateSize(connection: any, sizeName: string): Promise<number> {
  if (!sizeName) {
    throw new Error("Size name is required");
  }

  // Check if size exists
  const [existing] = await connection.execute(
    "SELECT id FROM sizes WHERE LOWER(size) = LOWER(?)",
    [sizeName.trim()]
  );

  if ((existing as any[]).length > 0) {
    return (existing as any[])[0].id;
  }

  // Create new size
  const [result] = await connection.execute(
    "INSERT INTO sizes (size) VALUES (?)",
    [sizeName.trim()]
  );

  return (result as any).insertId;
}

// Helper function to validate parent product exists
async function validateParentProduct(connection: any, parentId: number): Promise<boolean> {
  if (!parentId) return true; // Optional field

  const [existing] = await connection.execute(
    "SELECT id FROM products WHERE id = ?",
    [parentId]
  );

  return (existing as any[]).length > 0;
}

// Helper function to get or create size group
async function getOrCreateSizeGroup(connection: any, sizeGroupName: string, sizeNames: string[]): Promise<number> {
  if (!sizeGroupName) {
    throw new Error("Size group name is required");
  }

  // Check if size group exists
  const [existing] = await connection.execute(
    "SELECT id FROM size_groups WHERE LOWER(name) = LOWER(?)",
    [sizeGroupName.trim()]
  );

  if ((existing as any[]).length > 0) {
    return (existing as any[])[0].id;
  }

  // Create new size group with the sizes from variants
  const uniqueSizes = [...new Set(sizeNames.map(s => s.trim()))];
  
  const [result] = await connection.execute(
    "INSERT INTO size_groups (name, sizes) VALUES (?, ?)",
    [sizeGroupName.trim(), JSON.stringify(uniqueSizes)]
  );

  return (result as any).insertId;
}

// Create product using names instead of IDs
router.post("/", async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const {
      name,
      description,
      category_name,
      base_price,
      sale_price,
      suggested_price,
      sku,
      parent_sku,
      parent_id,
      photo,
      photo_url,
      variants,
      size_group_name,
    }: ProductByNamesRequest = req.body;

    if (!name) {
      return res.status(400).json({ error: "Product name is required" });
    }

    if (!variants || variants.length === 0) {
      return res.status(400).json({ error: "At least one variant is required" });
    }

    // Validate parent product if parent_id is provided
    if (parent_id) {
      const parentExists = await validateParentProduct(connection, parent_id);
      if (!parentExists) {
        return res.status(400).json({ error: `Parent product with ID ${parent_id} does not exist` });
      }
    }

    // Get or create category
    let categoryId = null;
    if (category_name) {
      categoryId = await getOrCreateCategory(connection, category_name);
    }

    // Get or create size group if provided
    let sizeGroupId = null;
    if (size_group_name) {
      const sizeNames = variants.map(v => v.size_name);
      sizeGroupId = await getOrCreateSizeGroup(connection, size_group_name, sizeNames);
    }

    // Conceito otimizado de foto: uma foto principal por produto
    let photoPath = photo || null;
    let photoDownloaded = false;
    let photoError = null;

    if (photo_url && !photo) {
      try {
        console.log(`📸 Baixando foto para produto: ${name}`);
        const downloadedPath = await downloadImage(photo_url, name);
        if (downloadedPath) {
          photoPath = downloadedPath;
          photoDownloaded = true;
          console.log(`✅ Foto salva em: ${downloadedPath}`);
        } else {
          photoError = "Failed to download image";
          console.log(`❌ Falha ao baixar foto de: ${photo_url}`);
        }
      } catch (error) {
        photoError = error.message;
        console.error("❌ Erro no download da imagem:", error);
        // Continue sem foto se o download falhar
      }
    }

    // Create the product with parent_id
    const [result] = await connection.execute(
      `INSERT INTO products (name, description, category_id, base_price, sale_price, suggested_price, sku, parent_sku, parent_id, photo, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        description || null,
        categoryId,
        base_price || null,
        sale_price || null,
        suggested_price || null,
        sku || null,
        parent_sku || null,
        parent_id || null, // ID do produto pai para hierarquia
        photoPath, // Foto principal do produto (não das variantes)
        true,
      ]
    );

    const productId = (result as any).insertId;

    // Process variants
    for (const variant of variants) {
      if (!variant.size_name || !variant.color_name) {
        throw new Error("Size name and color name are required for each variant");
      }

      // Get or create size and color
      const sizeId = await getOrCreateSize(connection, variant.size_name);
      const colorId = await getOrCreateColor(connection, variant.color_name);

      // Create variant
      await connection.execute(
        `INSERT INTO product_variants (product_id, size_id, color_id, stock, price_override)
         VALUES (?, ?, ?, ?, ?)`,
        [
          productId,
          sizeId,
          colorId,
          variant.stock || 0,
          variant.price_override || null,
        ]
      );
    }

    await connection.commit();

    // Fetch the created product with all information
    const [productRows] = await db.execute(
      `SELECT p.*, c.name as category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.id = ?`,
      [productId]
    );

    const product = (productRows as any)[0];

    // Get variants with names
    const [variantRows] = await db.execute(
      `SELECT pv.*, s.size as size_name, c.name as color_name, c.hex_code
       FROM product_variants pv
       LEFT JOIN sizes s ON pv.size_id = s.id
       LEFT JOIN colors c ON pv.color_id = c.id
       WHERE pv.product_id = ?`,
      [productId]
    );

    product.variants = variantRows;
    product.variant_count = (variantRows as any[]).length;
    product.total_stock = (variantRows as any[]).reduce(
      (sum, variant) => sum + (variant.stock || 0),
      0
    );

    // Get parent product info if exists
    let parentProduct = null;
    if (parent_id) {
      const [parentRows] = await db.execute(
        "SELECT id, name, sku FROM products WHERE id = ?",
        [parent_id]
      );
      parentProduct = (parentRows as any[])[0] || null;
    }

    res.status(201).json({
      message: "Product created successfully",
      product: {
        ...product,
        parent_product: parentProduct
      },
      created_resources: {
        category_created: category_name ? true : false,
        colors_created: [...new Set(variants.map(v => v.color_name))], // Remove duplicates
        sizes_created: [...new Set(variants.map(v => v.size_name))], // Remove duplicates
        size_group_created: size_group_name ? true : false,
        photo_status: {
          downloaded: photoDownloaded,
          url_original: photo_url || null,
          path_saved: photoPath || null,
          error: photoError || null
        },
        parent_reference: parent_id ? {
          parent_id: parent_id,
          parent_found: parentProduct !== null,
          parent_name: parentProduct?.name || null
        } : null
      },
      summary: {
        product_name: name,
        variants_created: variants.length,
        unique_colors: [...new Set(variants.map(v => v.color_name))].length,
        unique_sizes: [...new Set(variants.map(v => v.size_name))].length,
        total_stock: variants.reduce((sum, v) => sum + (v.stock || 0), 0),
        has_parent: !!parent_id,
        has_photo: !!photoPath
      }
    });

  } catch (error: any) {
    await connection.rollback();
    console.error("Error creating product by names:", error);
    
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "SKU already exists" });
    }
    
    res.status(500).json({ 
      error: "Failed to create product", 
      details: error.message 
    });
  } finally {
    connection.release();
  }
});

export { router as productsByNamesRouter };
