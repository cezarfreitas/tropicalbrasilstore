// Debug script to test store API and image data
console.log('🔍 Debug Store API and Image Data...');

async function debugStoreAPI() {
  try {
    const response = await fetch('/api/store/products-paginated?page=1&limit=10');
    const data = await response.json();
    
    console.log('📊 Store API Response:', data);
    
    if (data.products && data.products.length > 0) {
      console.log(`\n📦 Found ${data.products.length} products:`);
      
      data.products.forEach((product, index) => {
        console.log(`\n${index + 1}. Product: ${product.name} (ID: ${product.id})`);
        console.log(`   Photo: ${product.photo || 'null'}`);
        console.log(`   Category: ${product.category_name || 'null'}`);
        
        if (product.available_colors && product.available_colors.length > 0) {
          console.log(`   Colors (${product.available_colors.length}):`);
          product.available_colors.forEach((color, colorIndex) => {
            console.log(`     ${colorIndex + 1}. ${color.name}: ${color.image_url || 'no image'}`);
          });
        } else {
          console.log('   Colors: none');
        }
        
        // Check if this product would have an image using our logic
        const hasMainPhoto = !!product.photo;
        const hasColorImages = product.available_colors?.some(c => c.image_url);
        const shouldShowImage = hasMainPhoto || hasColorImages;
        
        console.log(`   Should show image: ${shouldShowImage ? '✅' : '❌'}`);
        
        if (product.id === 649) {
          console.log('   🎯 THIS IS PRODUCT 649 - the test product!');
        }
      });
    } else {
      console.log('❌ No products found in API response');
    }
    
  } catch (error) {
    console.error('❌ Error fetching store API:', error);
  }
}

debugStoreAPI();

// Also test the WooCommerce API
async function debugWooCommerceAPI() {
  try {
    console.log('\n🔍 Testing WooCommerce API...');
    const response = await fetch('/api/products-woocommerce?page=1&limit=10');
    const data = await response.json();
    
    console.log('📊 WooCommerce API Response:', data);
    
    if (data.data && data.data.length > 0) {
      console.log(`\n📦 Found ${data.data.length} products in WooCommerce API:`);
      
      data.data.forEach((product, index) => {
        console.log(`\n${index + 1}. Product: ${product.name} (ID: ${product.id})`);
        
        if (product.color_variants && product.color_variants.length > 0) {
          console.log(`   Color Variants (${product.color_variants.length}):`);
          product.color_variants.forEach((variant, variantIndex) => {
            console.log(`     ${variantIndex + 1}. ${variant.color_name}:`);
            console.log(`        image_url: ${variant.image_url || 'null'}`);
            console.log(`        images: ${variant.images ? `[${variant.images.join(', ')}]` : 'null'}`);
            console.log(`        is_main_catalog: ${variant.is_main_catalog || false}`);
          });
        } else {
          console.log('   Color Variants: none');
        }
        
        if (product.id === 649) {
          console.log('   🎯 THIS IS PRODUCT 649 - the test product!');
        }
      });
    }
  } catch (error) {
    console.error('❌ Error fetching WooCommerce API:', error);
  }
}

debugWooCommerceAPI();
