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
      timeout: 10000, // 10 second timeout
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    // Get file extension from URL or content type
    let extension = path.extname(new URL(imageUrl).pathname);
    if (!extension) {
      const contentType = response.headers["content-type"];
      if (contentType?.includes("jpeg") || contentType?.includes("jpg")) {
        extension = ".jpg";
      } else if (contentType?.includes("png")) {
        extension = ".png";
      } else if (contentType?.includes("webp")) {
        extension = ".webp";
      } else {
        extension = ".jpg"; // Default fallback
      }
    }

    // Create safe filename
    const safeProductSku = productSku
      .replace(/[^a-zA-Z0-9]/g, "-")
      .toLowerCase();
    const safeColorName = colorName.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
    const timestamp = Date.now();
    const filename = `${safeProductSku}-${safeColorName}-${timestamp}${extension}`;

    // Save to disk
    const filepath = path.join(uploadDir, filename);
    fs.writeFileSync(filepath, response.data);

    // Return public URL path
    const publicUrl = `/uploads/products/${filename}`;
    console.log(`✅ Image saved: ${publicUrl}`);

    return publicUrl;
  } catch (error: any) {
    console.error(
      `❌ Failed to download image from ${imageUrl}:`,
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
