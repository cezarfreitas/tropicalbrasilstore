#!/usr/bin/env node

async function testStoreAPI() {
  console.log("🧪 Testing store API...");

  try {
    const response = await fetch(
      "http://localhost:5000/api/store/products-paginated?page=1&limit=5",
    );

    console.log(`📊 Response status: ${response.status}`);

    if (response.ok) {
      const data = await response.json();
      console.log("📝 Store API Response:", JSON.stringify(data, null, 2));

      // Check image data specifically
      if (data.products && data.products.length > 0) {
        console.log("\n🖼️ Image data analysis:");
        data.products.forEach((product, index) => {
          console.log(`\nProduct ${index + 1}: ${product.name}`);
          console.log(`  - photo: ${product.photo || "null"}`);
          console.log(
            `  - available_colors: ${product.available_colors?.length || 0} colors`,
          );

          if (product.available_colors) {
            product.available_colors.forEach((color, colorIndex) => {
              console.log(
                `    Color ${colorIndex + 1}: ${color.name} - image_url: ${color.image_url || "null"}`,
              );
            });
          }
        });
      }
    } else {
      console.log("❌ API failed with status:", response.status);
      const errorText = await response.text();
      console.log("Error:", errorText);
    }
  } catch (error) {
    console.error("💥 Test failed:", error.message);
  }
}

testStoreAPI();
