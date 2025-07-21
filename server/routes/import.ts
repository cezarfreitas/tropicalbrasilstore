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
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.csv', '.xlsx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are allowed'));
    }
  },
});

// Store import progress in memory (in production, use Redis or database)
let importProgress = {
  total: 0,
  processed: 0,
  success: 0,
  errors: 0,
  current: '',
  isRunning: false,
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

    if (fileExtension === '.csv') {
      // Parse CSV
      await new Promise((resolve, reject) => {
        const results: any[] = [];
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('headers', (headerList) => {
            headers = headerList;
          })
          .on('data', (data) => results.push(data))
          .on('end', () => {
            data = results;
            resolve(data);
          })
          .on('error', reject);
      });
    } else if (fileExtension === '.xlsx') {
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
            obj[header] = row[index] || '';
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
async function downloadImage(url: string, filename: string): Promise<string | null> {
  try {
    const publicDir = path.join(process.cwd(), 'public', 'uploads', 'products');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const ext = path.extname(url) || '.jpg';
    const safeName = filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const imagePath = path.join(publicDir, `${safeName}${ext}`);
    const publicPath = `/uploads/products/${safeName}${ext}`;

    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    await streamPipeline(response.data, fs.createWriteStream(imagePath));
    
    return publicPath;
  } catch (error) {
    console.error(`Error downloading image from ${url}:`, error);
    return null;
  }
}

// Process colors string and ensure they exist in database
async function processColors(colorsString: string): Promise<number[]> {
  if (!colorsString) return [];
  
  const colorNames = colorsString.split(',').map(c => c.trim()).filter(c => c);
  const colorIds: number[] = [];

  for (const colorName of colorNames) {
    // Check if color exists
    const [existing] = await db.execute(
      "SELECT id FROM colors WHERE LOWER(name) = LOWER(?)",
      [colorName]
    );

    let colorId: number;
    if ((existing as any[]).length > 0) {
      colorId = (existing as any[])[0].id;
    } else {
      // Create new color with default hex
      const [result] = await db.execute(
        "INSERT INTO colors (name, hex_code) VALUES (?, ?)",
        [colorName, generateRandomHex()]
      );
      colorId = (result as any).insertId;
    }
    
    colorIds.push(colorId);
  }

  return colorIds;
}

function generateRandomHex(): string {
  return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
}

// Get available sizes for a size group
async function getSizesForGroup(sizeGroupId: number): Promise<any[]> {
  const [sizeGroup] = await db.execute(
    "SELECT sizes FROM size_groups WHERE id = ?",
    [sizeGroupId]
  );

  if ((sizeGroup as any[]).length === 0) {
    throw new Error(`Size group ${sizeGroupId} not found`);
  }

  const sizes = (sizeGroup as any[])[0].sizes;
  
  // Get size IDs from database
  const [sizeRows] = await db.execute(
    `SELECT id, size FROM sizes WHERE size IN (${sizes.map(() => '?').join(',')})`,
    sizes
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
      current: '',
      isRunning: true,
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

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    
    try {
      importProgress.current = item.name || `Item ${i + 1}`;
      
      await connection.beginTransaction();

      // Validate required fields
      if (!item.name || !item.category_id || !item.base_price || !item.size_group_id) {
        throw new Error("Missing required fields: name, category_id, base_price, size_group_id");
      }

      // Download image if URL provided
      let photoPath = null;
      if (item.photo_url) {
        photoPath = await downloadImage(item.photo_url, item.name);
      }

      // Process colors
      const colorIds = await processColors(item.colors || '');
      if (colorIds.length === 0) {
        throw new Error("At least one color is required");
      }

      // Get sizes for the group
      const sizes = await getSizesForGroup(parseInt(item.size_group_id));
      if (sizes.length === 0) {
        throw new Error(`No sizes found for size group ${item.size_group_id}`);
      }

      // Create product
      const [productResult] = await connection.execute(
        `INSERT INTO products (
          name, description, category_id, base_price, suggested_price, 
          sku, parent_sku, photo, active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.name,
          item.description || null,
          parseInt(item.category_id),
          parseFloat(item.base_price),
          item.suggested_price ? parseFloat(item.suggested_price) : null,
          item.sku || null,
          item.parent_sku || null,
          photoPath,
          true
        ]
      );

      const productId = (productResult as any).insertId;

      // Create variants for each color and size combination
      const stockPerVariant = parseInt(item.stock_per_variant) || 0;
      
      for (const colorId of colorIds) {
        for (const size of sizes) {
          await connection.execute(
            `INSERT INTO product_variants (product_id, size_id, color_id, stock)
             VALUES (?, ?, ?, ?)`,
            [productId, size.id, colorId, stockPerVariant]
          );
        }
      }

      await connection.commit();
      importProgress.success++;
      
    } catch (error) {
      await connection.rollback();
      console.error(`Error processing item ${i + 1}:`, error);
      importProgress.errors++;
    }

    importProgress.processed++;
  }

  connection.release();
  importProgress.isRunning = false;
  importProgress.current = '';
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
    current: '',
    isRunning: false,
  };
  res.json({ message: "Progress reset" });
});

export { router as importRouter };
