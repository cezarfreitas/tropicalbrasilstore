#!/usr/bin/env node

import { createConnection } from "mysql2/promise";

async function check649ImageData() {
  const connection = await createConnection({
    host: "5.161.52.206",
    port: 3232,
    user: "tropical",
    password: "805ce7692e5b4d6ced5f",
    database: "tropical",
  });

  try {
    console.log("🔍 Checking product 649 image data specifically...\n");

    // 1. Check basic product info
    const [product] = await connection.execute(
      "SELECT id, name, photo, active FROM products WHERE id = 649",
    );

    console.log("📦 Product 649 basic info:");
    console.log(product[0]);

    // 2. Check product_color_variants
    const [colorVariants] = await connection.execute(`
      SELECT pcv.id, pcv.variant_name, pcv.color_id, pcv.image_url, pcv.active,
             c.name as color_name, c.hex_code
      FROM product_color_variants pcv
      LEFT JOIN colors c ON pcv.color_id = c.id
      WHERE pcv.product_id = 649
    `);

    console.log("\n🎨 Product 649 color variants:");
    colorVariants.forEach((variant, index) => {
      console.log(`  ${index + 1}. ${variant.variant_name || "unnamed"}`);
      console.log(
        `     Color: ${variant.color_name} (${variant.hex_code || "no hex"})`,
      );
      console.log(`     Image URL: ${variant.image_url || "NULL"}`);
      console.log(`     Active: ${variant.active}`);
      console.log("");
    });

    // 3. Test the exact query used by store API individual product
    const [storeApiResult] = await connection.execute(`
      SELECT
        pcv.id,
        NULL as size_id,
        pcv.color_id,
        0 as stock,
        pcv.price as price_override,
        NULL as size,
        NULL as display_order,
        c.name as color_name,
        c.hex_code,
        pcv.image_url
       FROM product_color_variants pcv
       LEFT JOIN colors c ON pcv.color_id = c.id
       WHERE pcv.product_id = 649 AND pcv.active = true
       ORDER BY c.name
    `);

    console.log("🔧 Store API query result (what ProductDetail page gets):");
    storeApiResult.forEach((variant, index) => {
      console.log(`  ${index + 1}. Color: ${variant.color_name}`);
      console.log(`     Image URL: ${variant.image_url || "NULL"}`);
      console.log("");
    });

    // 4. Test the exact query used by store-simple API (listing)
    const [listingApiResult] = await connection.execute(`
      SELECT DISTINCT
        co.id,
        co.name,
        co.hex_code,
        pcv.image_url
      FROM product_color_variants pcv
      LEFT JOIN colors co ON pcv.color_id = co.id
      WHERE pcv.product_id = 649 AND pcv.active = true AND co.id IS NOT NULL
      ORDER BY co.name
    `);

    console.log("📋 Listing API query result (what card gets):");
    listingApiResult.forEach((color, index) => {
      console.log(`  ${index + 1}. Color: ${color.name}`);
      console.log(`     Image URL: ${color.image_url || "NULL"}`);
      console.log("");
    });

    // 5. Summary
    console.log("📊 SUMMARY:");
    console.log(`Product 649 basic photo: ${product[0].photo || "NULL"}`);
    console.log(`Color variants count: ${colorVariants.length}`);
    console.log(
      `Variants with images: ${colorVariants.filter((v) => v.image_url).length}`,
    );
    console.log(`Store API results: ${storeApiResult.length}`);
    console.log(`Listing API results: ${listingApiResult.length}`);

    if (storeApiResult.length > 0 && listingApiResult.length === 0) {
      console.log(
        "\n⚠️  ISSUE FOUND: Store API returns data but Listing API doesn't!",
      );
      console.log(
        "This explains why image appears in product page but not in card.",
      );
    }
  } catch (error) {
    console.error("💥 Error:", error.message);
  } finally {
    await connection.end();
  }
}

check649ImageData();
