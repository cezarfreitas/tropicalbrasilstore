#!/usr/bin/env node

import { createConnection } from "mysql2/promise";
import { existsSync } from "fs";
import { join } from "path";

async function verifyImages() {
  try {
    const connection = await createConnection({
      host: "5.161.52.206",
      port: 3232,
      user: "tropical",
      password: "805ce7692e5b4d6ced5f",
      database: "tropical",
    });

    console.log("🔍 Checking image URLs vs actual files...\n");

    // Check products with photos
    const [products] = await connection.execute(
      'SELECT id, name, photo FROM products WHERE photo IS NOT NULL AND photo != ""',
    );

    console.log(`📦 Products with photo field: ${products.length}`);
    for (const product of products) {
      const relativePath = product.photo.startsWith("/")
        ? product.photo.substring(1)
        : product.photo;
      const fullPath = join(process.cwd(), "public", relativePath);
      const exists = existsSync(fullPath);

      console.log(
        `  ${product.name}: ${product.photo} - ${exists ? "✅ EXISTS" : "❌ MISSING"}`,
      );
    }

    // Check color variants with image_url
    const [variants] = await connection.execute(`
      SELECT pcv.id, pcv.variant_name, pcv.image_url, p.name as product_name
      FROM product_color_variants pcv 
      LEFT JOIN products p ON pcv.product_id = p.id
      WHERE pcv.image_url IS NOT NULL AND pcv.image_url != ""
      LIMIT 20
    `);

    console.log(`\n🎨 Color variants with image_url: ${variants.length}`);
    for (const variant of variants) {
      const relativePath = variant.image_url.startsWith("/")
        ? variant.image_url.substring(1)
        : variant.image_url;
      const fullPath = join(process.cwd(), "public", relativePath);
      const exists = existsSync(fullPath);

      console.log(
        `  ${variant.product_name} - ${variant.variant_name}: ${variant.image_url} - ${exists ? "✅ EXISTS" : "❌ MISSING"}`,
      );
    }

    await connection.end();
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

verifyImages();
