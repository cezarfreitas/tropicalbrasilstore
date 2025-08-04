const axios = require('axios');

async function testImageUrls() {
  try {
    console.log('🧪 Testando URLs de imagens...');
    
    // Test store products API
    const storeResponse = await axios.get('https://ide-b2b-tb.jzo3qo.easypanel.host/api/store/products-paginated?page=1&limit=5');
    
    if (storeResponse.data.products) {
      console.log('\n📦 Store Products:');
      storeResponse.data.products.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name}`);
        console.log(`   Photo: ${product.photo || 'null'}`);
        if (product.available_colors) {
          product.available_colors.forEach((color, colorIndex) => {
            console.log(`   Color ${colorIndex + 1}: ${color.name} - Image: ${color.image_url || 'null'}`);
          });
        }
        console.log('');
      });
    }
    
    // Test WooCommerce products API
    const wooResponse = await axios.get('https://ide-b2b-tb.jzo3qo.easypanel.host/api/products-woocommerce?page=1&limit=5');
    
    if (wooResponse.data.data) {
      console.log('\n🛍️ WooCommerce Products:');
      wooResponse.data.data.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name}`);
        if (product.color_variants) {
          product.color_variants.forEach((variant, variantIndex) => {
            console.log(`   Variant ${variantIndex + 1}: ${variant.color_name} - Image: ${variant.image_url || 'null'}`);
          });
        }
        console.log('');
      });
    }
    
    // Test product 649 specifically
    try {
      const product649 = await axios.get('https://ide-b2b-tb.jzo3qo.easypanel.host/api/store/products-paginated?page=1&limit=100');
      const found649 = product649.data.products?.find(p => p.id === 649);
      
      if (found649) {
        console.log('\n🎯 Product 649 Details:');
        console.log(`Name: ${found649.name}`);
        console.log(`Photo: ${found649.photo || 'null'}`);
        if (found649.available_colors) {
          found649.available_colors.forEach((color, colorIndex) => {
            console.log(`Color ${colorIndex + 1}: ${color.name} - Image: ${color.image_url || 'null'}`);
          });
        }
      } else {
        console.log('\n❌ Product 649 not found');
      }
    } catch (error) {
      console.log('\n❌ Error fetching product 649:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar URLs:', error.message);
  }
}

testImageUrls();
