import fs from "fs";
import path from "path";
import axios from "axios";
import sharp from "sharp";

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), "public", "uploads", "products");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export async function downloadAndSaveImage(
  imageUrl: string,
  productSku: string,
  colorName: string,
): Promise<string | null> {
  try {
    console.log(`📥 Downloading image: ${imageUrl}`);

    // Download the image
    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      timeout: 30000, // 30 second timeout for large images
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    // Create safe filename
    const safeProductSku = productSku
      .replace(/[^a-zA-Z0-9]/g, "-")
      .toLowerCase();
    const safeColorName = colorName.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
    const timestamp = Date.now();

    // Convert to WebP for better compression and performance
    const filename = `${safeProductSku}-${safeColorName}-${timestamp}.webp`;
    const filepath = path.join(uploadDir, filename);

    // Process image with Sharp for ecommerce optimization
    await sharp(response.data)
      .resize(800, 800, {
        fit: 'inside',
        withoutEnlargement: true,
        background: { r: 255, g: 255, b: 255, alpha: 1 } // White background for transparent images
      })
      .webp({
        quality: 85, // High quality for ecommerce
        effort: 6,   // Better compression
      })
      .toFile(filepath);

    // Create thumbnail version (300x300)
    const thumbnailFilename = `${safeProductSku}-${safeColorName}-${timestamp}_thumb.webp`;
    const thumbnailPath = path.join(uploadDir, thumbnailFilename);

    await sharp(response.data)
      .resize(300, 300, {
        fit: 'inside',
        withoutEnlargement: true,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .webp({
        quality: 80,
        effort: 6,
      })
      .toFile(thumbnailPath);

    // Return public URL path for main image
    const publicUrl = `/uploads/products/${filename}`;
    const thumbnailUrl = `/uploads/products/${thumbnailFilename}`;

    console.log(`✅ Image optimized and saved: ${publicUrl}`);
    console.log(`✅ Thumbnail created: ${thumbnailUrl}`);

    return publicUrl;
  } catch (error: any) {
    console.error(
      `❌ Failed to download and process image from ${imageUrl}:`,
      error.message,
    );
    return null;
  }
}

export function isValidImageUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    const pathname = parsedUrl.pathname.toLowerCase();

    // Check if URL ends with image extension
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"];
    return (
      imageExtensions.some((ext) => pathname.endsWith(ext)) ||
      pathname.includes("image")
    );
  } catch {
    return false;
  }
}
