#!/usr/bin/env node

async function debugProduct649() {
  console.log("🔍 Debugging product 649 data from store API...");

  try {
    // Test the store API
    const storeResponse = await fetch(
      "http://localhost:3001/api/store/products-paginated?page=1&limit=10"
    );

    if (!storeResponse.ok) {
      console.log("❌ Store API failed with status:", storeResponse.status);
      return;
    }

    const storeData = await storeResponse.json();
    console.log(`✅ Store API responded with ${storeData.products?.length || 0} products`);

    const product649 = storeData.products?.find(p => p.id === 649);
    
    if (product649) {
      console.log("\n📦 Product 649 detailed data:");
      console.log(JSON.stringify(product649, null, 2));
      
      console.log("\n🎨 Available colors analysis:");
      if (product649.available_colors && product649.available_colors.length > 0) {
        product649.available_colors.forEach((color, index) => {
          console.log(`\nColor ${index + 1}:`);
          console.log(`  - ID: ${color.id}`);
          console.log(`  - Name: ${color.name}`);
          console.log(`  - Hex: ${color.hex_code || 'null'}`);
          console.log(`  - Image URL: ${color.image_url || 'NULL'}`);
          console.log(`  - Image URL type: ${typeof color.image_url}`);
          console.log(`  - Image URL trimmed: "${(color.image_url || '').trim()}"`);
          console.log(`  - Has valid image: ${!!(color.image_url && color.image_url.trim())}`);
        });
      } else {
        console.log("❌ No available_colors found!");
      }

      console.log("\n📷 Photo analysis:");
      console.log(`  - Photo: ${product649.photo || 'NULL'}`);
      console.log(`  - Photo type: ${typeof product649.photo}`);
      console.log(`  - Photo trimmed: "${(product649.photo || '').trim()}"`);
      console.log(`  - Has valid photo: ${!!(product649.photo && product649.photo.trim())}`);

    } else {
      console.log("❌ Product 649 not found in store API response!");
      console.log("Available product IDs:", storeData.products?.map(p => p.id) || []);
    }

    // Also test direct product API
    try {
      const directResponse = await fetch("http://localhost:3001/api/products/649");
      if (directResponse.ok) {
        const directData = await directResponse.json();
        console.log("\n🔍 Direct product API data:");
        console.log(JSON.stringify(directData, null, 2));
      }
    } catch (error) {
      console.log("⚠️ Direct product API failed:", error.message);
    }

  } catch (error) {
    console.error("💥 Debug failed:", error.message);
  }
}

debugProduct649();
