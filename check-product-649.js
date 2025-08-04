#!/usr/bin/env node

async function checkProduct649() {
  console.log("🔍 Investigating product 649...\n");

  try {
    // Check products API response
    const response = await fetch(
      "http://localhost:5000/api/store/products-paginated?page=1&limit=50",
    );

    if (response.ok) {
      const data = await response.json();
      console.log(
        `📊 Store API returned ${data.products?.length || 0} products`,
      );

      // Find product 649
      const product649 = data.products?.find((p) => p.id === 649);

      if (product649) {
        console.log("✅ Product 649 FOUND in store API:");
        console.log("  - Name:", product649.name);
        console.log("  - Photo:", product649.photo || "null");
        console.log(
          "  - Available colors:",
          product649.available_colors?.length || 0,
        );
        console.log("  - Active:", product649.active);

        if (product649.available_colors) {
          product649.available_colors.forEach((color, index) => {
            console.log(
              `    Color ${index + 1}: ${color.name} - image_url: ${color.image_url || "null"}`,
            );
          });
        }
      } else {
        console.log("❌ Product 649 NOT FOUND in store API");

        // Show all products returned
        console.log("\n📋 All products returned:");
        data.products?.forEach((p, index) => {
          console.log(
            `  ${index + 1}. ID: ${p.id} - ${p.name} - photo: ${p.photo || "null"}`,
          );
        });
      }
    } else {
      console.log("❌ Store API failed:", response.status);
    }

    // Also check the individual product API
    console.log("\n🔍 Checking individual product API...");
    const productResponse = await fetch(
      "http://localhost:5000/api/store/products/649",
    );

    if (productResponse.ok) {
      const productData = await productResponse.json();
      console.log("✅ Individual product API returned:");
      console.log("  - Name:", productData.name);
      console.log("  - Photo:", productData.photo || "null");
      console.log("  - Active:", productData.active);
    } else {
      console.log("❌ Individual product API failed:", productResponse.status);
    }
  } catch (error) {
    console.error("💥 Error:", error.message);
  }
}

checkProduct649();
