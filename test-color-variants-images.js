#!/usr/bin/env node

// Test product_color_variants images specifically
console.log("🔍 Testing product_color_variants image_url data...");

async function testColorVariantsAPI() {
  try {
    // Test the store API to get actual data
    const response = await fetch(
      "http://localhost:3001/api/store/products-paginated?page=1&limit=10",
    );

    if (!response.ok) {
      console.log("❌ API failed with status:", response.status);
      return;
    }

    const data = await response.json();
    console.log(
      `✅ Store API responded with ${data.products?.length || 0} products`,
    );

    if (data.products && data.products.length > 0) {
      console.log(
        "\n🎨 Analyzing available_colors (from product_color_variants):",
      );

      data.products.forEach((product, index) => {
        console.log(`\n📦 Product ${product.id}: ${product.name}`);
        console.log(`  📷 Product photo: ${product.photo || "null"}`);

        if (product.available_colors && product.available_colors.length > 0) {
          console.log(
            `  🎨 Available colors (${product.available_colors.length}):`,
          );

          product.available_colors.forEach((color, colorIndex) => {
            const hasImage = color.image_url && color.image_url.trim() !== "";
            console.log(
              `    ${colorIndex + 1}. ${color.name} (${color.hex_code || "no hex"})`,
            );
            console.log(
              `       🖼️  image_url: ${color.image_url || "NULL"} ${hasImage ? "✅" : "❌"}`,
            );

            if (hasImage) {
              // Test URL construction like SimpleProductCard
              let fullUrl = color.image_url;
              if (color.image_url.startsWith("/uploads/")) {
                fullUrl = `http://localhost:3001${color.image_url}`;
              }
              console.log(`       🌐 Full URL: ${fullUrl}`);
            }
          });
        } else {
          console.log(
            `  ❌ No available_colors (no product_color_variants data)`,
          );
        }
      });

      // Find products with color variant images
      const productsWithImages = data.products.filter((p) =>
        p.available_colors?.some(
          (c) => c.image_url && c.image_url.trim() !== "",
        ),
      );

      console.log(`\n📊 Summary:`);
      console.log(`- Total products: ${data.products.length}`);
      console.log(
        `- Products with available_colors: ${data.products.filter((p) => p.available_colors?.length > 0).length}`,
      );
      console.log(
        `- Products with color variant images: ${productsWithImages.length}`,
      );

      if (productsWithImages.length > 0) {
        console.log(`\n🎯 Best products for testing SimpleProductCard:`);
        productsWithImages.slice(0, 3).forEach((product) => {
          const firstImageColor = product.available_colors.find(
            (c) => c.image_url,
          );
          console.log(`- Product ${product.id}: ${product.name}`);
          console.log(
            `  First image: ${firstImageColor.name} -> ${firstImageColor.image_url}`,
          );
        });
      } else {
        console.log(`\n⚠️  No products found with color variant images!`);
        console.log(
          `This means the product_color_variants.image_url column is empty or the API isn't joining correctly.`,
        );
      }
    } else {
      console.log("❌ No products returned from API");
    }
  } catch (error) {
    console.error("💥 Test failed:", error.message);
  }
}

testColorVariantsAPI();
