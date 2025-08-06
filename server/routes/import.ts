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
      data: data.slice(0, 100), // Limit to 100 rows for initial preview to avoid large payloads
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
    // Validate URL
    if (!url || typeof url !== 'string' || url.trim() === '') {
      console.log(`❌ URL de imagem inválida: "${url}"`);
      return null;
    }

    const trimmedUrl = url.trim();

    // Check if it's a valid URL
    try {
      new URL(trimmedUrl);
    } catch {
      console.log(`❌ URL de imagem malformada: "${trimmedUrl}"`);
      return null;
    }

    console.log(`📥 Iniciando download: ${trimmedUrl}`);

    const publicDir = path.join(process.cwd(), "public", "uploads", "products");

    // Create directory if it doesn't exist
    if (!fs.existsSync(publicDir)) {
      console.log(`📁 Criando diretório: ${publicDir}`);
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const ext = path.extname(trimmedUrl) || ".jpg";
    const safeName = filename.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const timestamp = Date.now();
    const imagePath = path.join(publicDir, `${safeName}_${timestamp}${ext}`);
    const publicPath = `/uploads/products/${safeName}_${timestamp}${ext}`;

    console.log(`💾 Salvando em: ${imagePath}`);

    const response = await axios({
      method: "GET",
      url: trimmedUrl,
      responseType: "stream",
      timeout: 30000,
      maxRedirects: 5,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept": "image/*,*/*;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
      },
    });

    // Check response content type
    const contentType = response.headers['content-type'];
    if (!contentType || !contentType.startsWith('image/')) {
      console.log(`❌ Resposta não é uma imagem válida. Content-Type: ${contentType}`);
      return null;
    }

    await streamPipeline(response.data, fs.createWriteStream(imagePath));

    // Verify file was created and has content
    if (fs.existsSync(imagePath)) {
      const stats = fs.statSync(imagePath);
      if (stats.size > 0) {
        console.log(`✅ Imagem baixada com sucesso: ${publicPath} (${stats.size} bytes)`);
        return publicPath;
      } else {
        console.log(`❌ Arquivo criado mas está vazio: ${imagePath}`);
        fs.unlinkSync(imagePath); // Remove empty file
        return null;
      }
    } else {
      console.log(`❌ Arquivo não foi criado: ${imagePath}`);
      return null;
    }

  } catch (error) {
    console.error(`❌ Erro ao baixar imagem de ${url}:`, error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Headers:`, error.response.headers);
    }
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

async function processBrand(brandName: string): Promise<number> {
  if (!brandName || !brandName.trim()) {
    throw new Error("Brand name is required");
  }

  const trimmedBrand = brandName.trim();

  // Check if brand exists
  const [existing] = await db.execute(
    "SELECT id FROM brands WHERE LOWER(name) = LOWER(?)",
    [trimmedBrand],
  );

  let brandId: number;
  if ((existing as any[]).length > 0) {
    brandId = (existing as any[])[0].id;
  } else {
    // Create new brand
    const [result] = await db.execute(
      "INSERT INTO brands (name) VALUES (?)",
      [trimmedBrand],
    );
    brandId = (result as any).insertId;
    console.log(`✨ Created new brand: "${trimmedBrand}" (ID: ${brandId})`);
  }

  return brandId;
}

async function processGender(genderName: string): Promise<number> {
  if (!genderName || !genderName.trim()) {
    throw new Error("Gender name is required");
  }

  const trimmedGender = genderName.trim();

  // Check if gender exists
  const [existing] = await db.execute(
    "SELECT id FROM genders WHERE LOWER(name) = LOWER(?)",
    [trimmedGender],
  );

  let genderId: number;
  if ((existing as any[]).length > 0) {
    genderId = (existing as any[])[0].id;
  } else {
    // Create new gender
    const [result] = await db.execute(
      "INSERT INTO genders (name) VALUES (?)",
      [trimmedGender],
    );
    genderId = (result as any).insertId;
    console.log(`✨ Created new gender: "${trimmedGender}" (ID: ${genderId})`);
  }

  return genderId;
}

async function processType(typeName: string): Promise<number> {
  if (!typeName || !typeName.trim()) {
    throw new Error("Type name is required");
  }

  const trimmedType = typeName.trim();

  // Check if type exists
  const [existing] = await db.execute(
    "SELECT id FROM types WHERE LOWER(name) = LOWER(?)",
    [trimmedType],
  );

  let typeId: number;
  if ((existing as any[]).length > 0) {
    typeId = (existing as any[])[0].id;
  } else {
    // Create new type
    const [result] = await db.execute(
      "INSERT INTO types (name) VALUES (?)",
      [trimmedType],
    );
    typeId = (result as any).insertId;
    console.log(`✨ Created new type: "${trimmedType}" (ID: ${typeId})`);
  }

  return typeId;
}

async function processCategory(categoryName: string): Promise<number> {
  if (!categoryName || !categoryName.trim()) {
    throw new Error("Category name is required");
  }

  const trimmedCategory = categoryName.trim();

  // Check if category exists
  const [existing] = await db.execute(
    "SELECT id FROM categories WHERE LOWER(name) = LOWER(?)",
    [trimmedCategory],
  );

  let categoryId: number;
  if ((existing as any[]).length > 0) {
    categoryId = (existing as any[])[0].id;
  } else {
    // Create new category
    const [result] = await db.execute(
      "INSERT INTO categories (name, active) VALUES (?, 1)",
      [trimmedCategory],
    );
    categoryId = (result as any).insertId;
    console.log(`✨ Created new category: "${trimmedCategory}" (ID: ${categoryId})`);
  }

  return categoryId;
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

// Global variable to store all import data
let allImportData: any[] = [];

// Import products specifically for grade system (simplified)
router.post("/products-grade", async (req, res) => {
  try {
    console.log("\n🚀 === INICIANDO IMPORTAÇÃO DE GRADES ===");
    console.log("📦 Recebendo dados de importação de GRADES...");
    console.log("📊 Total de dados recebidos:", req.body?.data?.length || 0);

    const { data } = req.body;

    if (!data || !Array.isArray(data)) {
      console.error("❌ Formato de dados inválido para importação de grades");
      return res.status(400).json({ error: "Formato de dados inválido para importação de grades" });
    }

    if (data.length === 0) {
      console.error("❌ Nenhum dado para importar");
      return res.status(400).json({ error: "Nenhum dado para importar" });
    }

    console.log("🚀 Pulando verificações complexas e iniciando importação diretamente...");

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

    console.log("📋 Sample do primeiro item:", JSON.stringify(data[0], null, 2));
    console.log("🎯 Iniciando processamento...");

    // Start processing grade imports
    processGradeImport(data);

    res.json({
      message: "Importação de grades iniciada com sucesso",
      total: data.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("❌ Erro ao iniciar importação de grades:", error);
    res.status(500).json({ error: "Falha ao iniciar importação de grades" });
  }
});

// Import products (first batch or full data)
router.post("/products", async (req, res) => {
  try {
    console.log("📥 Recebendo dados de importação...");
    console.log("📦 Request body:", JSON.stringify(req.body, null, 2));

    const { data, totalBatches, currentBatch } = req.body;

    console.log("📊 Data recebida:", {
      dataType: typeof data,
      dataIsArray: Array.isArray(data),
      dataLength: data?.length,
      totalBatches,
      currentBatch,
      sampleItem: data?.[0]
    });

    if (!data || !Array.isArray(data)) {
      console.error("❌ Formato de dados inválido. Data:", data);
      console.error("❌ Tipo de data:", typeof data);
      console.error("❌ É array?", Array.isArray(data));
      return res.status(400).json({ error: "Invalid data format" });
    }

    if (totalBatches && currentBatch === 1) {
      // Initialize for batch processing
      allImportData = [...data];

      // Reset progress for total expected data
      importProgress = {
        total: 0, // Will be set when all batches are received
        processed: 0,
        success: 0,
        errors: 0,
        current: "",
        isRunning: false, // Don't start processing until all batches received
        errorDetails: [],
      };

      res.json({ message: "First batch received", batchSize: data.length });
    } else {
      // Single batch processing (original behavior)
      allImportData = data;

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
    }
  } catch (error) {
    console.error("Error starting import:", error);
    res.status(500).json({ error: "Failed to start import" });
  }
});

// Process additional batches
router.post("/products-batch", async (req, res) => {
  try {
    const { data, batchNumber } = req.body;

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ error: "Invalid batch data format" });
    }

    // Add to global import data
    allImportData = [...allImportData, ...data];

    res.json({
      message: `Batch ${batchNumber} received`,
      totalItems: allImportData.length,
      batchSize: data.length
    });
  } catch (error) {
    console.error("Error processing batch:", error);
    res.status(500).json({ error: "Failed to process batch" });
  }
});

// Start processing all batches
router.post("/start-batch-processing", async (req, res) => {
  try {
    if (allImportData.length === 0) {
      return res.status(400).json({ error: "No data to process" });
    }

    // Reset progress for all data
    importProgress = {
      total: allImportData.length,
      processed: 0,
      success: 0,
      errors: 0,
      current: "",
      isRunning: true,
      errorDetails: [],
    };

    // Start processing in background
    processImport(allImportData);

    res.json({ message: "Batch processing started", total: allImportData.length });
  } catch (error) {
    console.error("Error starting batch processing:", error);
    res.status(500).json({ error: "Failed to start batch processing" });
  }
});

async function processGradeImport(data: any[]) {
  console.log("🚀 IMPORTAÇÃO SIMPLES - Processando", data.length, "produtos");

  const connection = await db.getConnection();
  let processedItems = 0;

  for (const item of data) {
    try {
      console.log(`\n▶️ Produto ${processedItems + 1}: ${item.name || 'Sem nome'}`);

      importProgress.current = item.name || `Produto ${processedItems + 1}`;
      await connection.beginTransaction();

      // Validação básica apenas
      if (!item.name || !item.category_id || !item.base_price || !item.color) {
        throw new Error("Campos obrigatórios: name, category_id, base_price, color");
      }

      // Buscar ou criar categoria simples
      let categoryId = 1; // Default
      try {
        const [catResult] = await connection.execute("SELECT id FROM categories WHERE LOWER(name) = LOWER(?) LIMIT 1", [item.category_id]);
        if ((catResult as any[]).length > 0) {
          categoryId = (catResult as any[])[0].id;
        }
      } catch (error) {
        console.log("⚠️ Usando categoria padrão");
      }

      // Criar produto simples sem complicações
      let productId: number;

      const [productResult] = await connection.execute(
        `INSERT INTO products (name, category_id, base_price, active, stock_type) VALUES (?, ?, ?, ?, ?)`,
        [item.name, categoryId, parseFloat(item.base_price), true, 'grade']
      );
      productId = (productResult as any).insertId;
      console.log(`✅ Produto criado - ID: ${productId}`);

      // Criar cor simples
      let colorId;
      const [existingColor] = await connection.execute("SELECT id FROM colors WHERE LOWER(name) = LOWER(?) LIMIT 1", [item.color]);
      if ((existingColor as any[]).length > 0) {
        colorId = (existingColor as any[])[0].id;
      } else {
        const [newColor] = await connection.execute("INSERT INTO colors (name, hex_code) VALUES (?, ?)", [item.color, '#000000']);
        colorId = (newColor as any).insertId;
      }
      console.log(`✅ Cor: ${item.color} - ID: ${colorId}`);

      // Criar variantes básicas (tamanhos 37-44)
      const sizes = ['37', '38', '39', '40', '41', '42', '43', '44'];
      let variantsCreated = 0;

      for (const sizeValue of sizes) {
        try {
          // Buscar ou criar tamanho
          let sizeId;
          const [existingSize] = await connection.execute("SELECT id FROM sizes WHERE size = ? LIMIT 1", [sizeValue]);
          if ((existingSize as any[]).length > 0) {
            sizeId = (existingSize as any[])[0].id;
          } else {
            const [newSize] = await connection.execute("INSERT INTO sizes (size) VALUES (?)", [sizeValue]);
            sizeId = (newSize as any).insertId;
          }

          // Criar variante
          await connection.execute(
            "INSERT IGNORE INTO product_variants (product_id, size_id, color_id, stock) VALUES (?, ?, ?, ?)",
            [productId, sizeId, colorId, 0]
          );
          variantsCreated++;
        } catch (error) {
          console.warn(`⚠️ Erro no tamanho ${sizeValue}:`, error.message);
        }
      }

      console.log(`✅ ${variantsCreated} variantes criadas`);

      await connection.commit();
      console.log(`✅ SUCESSO: ${item.name} (${variantsCreated} variantes)`);

      importProgress.success++;
      processedItems++;

    } catch (error) {
      await connection.rollback();
      console.error(`❌ ERRO: ${item.name} - ${error.message}`);

      importProgress.errorDetails.push({
        row: processedItems + 1,
        productName: item.name || `Produto ${processedItems + 1}`,
        error: error instanceof Error ? error.message : String(error)
      });

      importProgress.errors++;
      processedItems++;
    }

    importProgress.processed = processedItems;
  }

  connection.release();
  importProgress.isRunning = false;
  importProgress.current = "";

  console.log(`🏁 CONCLUÍDO: ${importProgress.success} sucessos, ${importProgress.errors} erros`);
}

async function processImport(data: any[]) {
  console.log("🔄 Iniciando processamento de", data.length, "itens");
  console.log("📋 Sample item:", JSON.stringify(data[0], null, 2));

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
      console.log("🔄 Processando produto:", firstItem.name);
      console.log("📊 Item data:", JSON.stringify(firstItem, null, 2));

      importProgress.current =
        firstItem.name || `Produto ${processedItems + 1}`;

      await connection.beginTransaction();

      // Validate required fields
      if (
        !firstItem.name ||
        !firstItem.category_id ||
        !firstItem.base_price
      ) {
        console.error("❌ Campos obrigatórios faltando:", {
          name: !!firstItem.name,
          category_id: !!firstItem.category_id,
          base_price: !!firstItem.base_price
        });
        throw new Error(
          "Missing required fields: name, category_id, base_price",
        );
      }

      // Process optional brand, gender, and type by name
      let brandId = null;
      let genderId = null;
      let typeId = null;

      if (firstItem.brand_name && firstItem.brand_name.trim()) {
        brandId = await processBrand(firstItem.brand_name);
      } else if (firstItem.brand_id) {
        brandId = parseInt(firstItem.brand_id);
      }

      if (firstItem.gender_name && firstItem.gender_name.trim()) {
        genderId = await processGender(firstItem.gender_name);
      } else if (firstItem.gender_id) {
        genderId = parseInt(firstItem.gender_id);
      }

      if (firstItem.type_name && firstItem.type_name.trim()) {
        typeId = await processType(firstItem.type_name);
      } else if (firstItem.type_id) {
        typeId = parseInt(firstItem.type_id);
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
            sale_price = ?, suggested_price = ?, sku = ?, photo = ?,
            brand_id = ?, gender_id = ?, type_id = ?
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
            brandId,
            genderId,
            typeId,
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
            sku, parent_sku, photo, active, stock_type, brand_id, gender_id, type_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
            firstItem.stock_type || 'grade', // Novo campo de tipo de estoque
            brandId,
            genderId,
            typeId,
          ],
        );

        productId = (productResult as any).insertId;
      }

      // Get sizes for the group - default to a standard shoe size group if not specified
      let sizes = [];
      const sizeGroupId = firstItem.size_group_id ? parseInt(firstItem.size_group_id) : 1;
      try {
        sizes = await getSizesForGroup(sizeGroupId);
      } catch (error) {
        // Default to a standard size range if no size group found
        console.warn(`Size group ${sizeGroupId} not found, using default sizes`);
        const [defaultSizes] = await connection.execute(
          "SELECT id, size FROM sizes WHERE size IN ('37', '38', '39', '40', '41', '42', '43', '44') ORDER BY size"
        );
        sizes = defaultSizes as any[];
      }

      if (sizes.length === 0) {
        throw new Error(
          `No sizes available for processing`,
        );
      }

      // Process each color variation
      for (const item of productItems) {
        if (!item.color) {
          throw new Error("Color is required for each row");
        }

        // Process single color
        const colorId = await processColor(item.color);
        const stockType = item.stock_type || 'grade';

        if (stockType === 'grade') {
          // Estoque por grade - criar grade se não existir e configurar estoque
          const gradeStock = parseInt(item.grade_stock) || 0;

          // Buscar ou criar grade (usando size_group_id como referência)
          const [gradeResult] = await connection.execute(
            `SELECT id FROM grade_vendida WHERE name = ? LIMIT 1`,
            [`Grade Grupo ${item.size_group_id}`]
          );

          let gradeId;
          if ((gradeResult as any[]).length === 0) {
            // Criar nova grade
            const [newGrade] = await connection.execute(
              `INSERT INTO grade_vendida (name, description, active) VALUES (?, ?, ?)`,
              [`Grade Grupo ${item.size_group_id}`, `Grade automática para grupo ${item.size_group_id}`, 1]
            );
            gradeId = (newGrade as any).insertId;

            // Criar templates da grade para todos os tamanhos
            for (const size of sizes) {
              await connection.execute(
                `INSERT INTO grade_templates (grade_id, size_id, required_quantity) VALUES (?, ?, ?)`,
                [gradeId, size.id, 1]
              );
            }
          } else {
            gradeId = (gradeResult as any[])[0].id;
          }

          // Criar relação produto-cor-grade com estoque
          await connection.execute(
            `INSERT INTO product_color_grades (product_id, color_id, grade_id, stock_quantity)
             VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE stock_quantity = VALUES(stock_quantity)`,
            [productId, colorId, gradeId, gradeStock]
          );

          // Criar variantes físicas sem estoque (controlado pela grade)
          for (const size of sizes) {
            await connection.execute(
              `INSERT INTO product_variants (product_id, size_id, color_id, stock)
               VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE stock = VALUES(stock)`,
              [productId, size.id, colorId, 0]
            );
          }

        } else {
          // Estoque por tamanho - criar variantes com estoque individual
          const sizeStocks = {
            '37': parseInt(item.size_37) || 0,
            '38': parseInt(item.size_38) || 0,
            '39': parseInt(item.size_39) || 0,
            '40': parseInt(item.size_40) || 0,
            '41': parseInt(item.size_41) || 0,
            '42': parseInt(item.size_42) || 0,
            '43': parseInt(item.size_43) || 0,
            '44': parseInt(item.size_44) || 0,
          };

          for (const size of sizes) {
            const sizeStock = sizeStocks[size.size] || parseInt(item.stock_per_variant) || 0;
            await connection.execute(
              `INSERT INTO product_variants (product_id, size_id, color_id, stock)
               VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE stock = VALUES(stock)`,
              [productId, size.id, colorId, sizeStock]
            );
          }
        }
      }

      await connection.commit();
      importProgress.success++;
      processedItems += productItems.length;
    } catch (error) {
      await connection.rollback();
      console.error(`Error processing product ${productKey}:`, error);

      // Store error details for each item in this group
      const currentFirstItem = productItems[0];
      for (let i = 0; i < productItems.length; i++) {
        importProgress.errorDetails.push({
          row: processedItems + i + 1,
          productName: currentFirstItem?.name || `Produto ${processedItems + i + 1}`,
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
