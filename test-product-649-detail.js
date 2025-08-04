const https = require('https');

function testProduct649Detail() {
  console.log('🧪 Testando API de detalhes do produto 649...');
  
  const options = {
    hostname: 'ide-b2b-tb.jzo3qo.easypanel.host',
    port: 443,
    path: '/api/store/products/649',
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Test-Script/1.0'
    }
  };

  const req = https.request(options, (res) => {
    console.log(`📡 Status Code: ${res.statusCode}`);
    console.log(`📄 Headers:`, res.headers);
    
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const product = JSON.parse(data);
        
        console.log('\n📦 Product 649 Details:');
        console.log(`   ID: ${product.id}`);
        console.log(`   Name: ${product.name}`);
        console.log(`   Photo: ${product.photo || 'null'}`);
        console.log(`   Active: ${product.active}`);
        console.log(`   Sell without stock: ${product.sell_without_stock}`);
        
        console.log(`\n🎨 Variants (${product.variants?.length || 0}):`);
        if (product.variants) {
          product.variants.forEach((variant, index) => {
            console.log(`   ${index + 1}. Color: ${variant.color_name} (ID: ${variant.color_id})`);
            console.log(`      Size: ${variant.size} (ID: ${variant.size_id})`);
            console.log(`      Stock: ${variant.stock}`);
            console.log(`      Image URL: ${variant.image_url || 'null'}`);
            console.log(`      Price Override: ${variant.price_override}`);
            console.log('');
          });
        }
        
        console.log(`\n📊 Available Grades (${product.available_grades?.length || 0}):`);
        if (product.available_grades) {
          product.available_grades.forEach((grade, index) => {
            console.log(`   ${index + 1}. Grade: ${grade.name} (ID: ${grade.id})`);
            console.log(`      Color: ${grade.color_name} (ID: ${grade.color_id})`);
            console.log(`      Total Quantity: ${grade.total_quantity}`);
            console.log(`      Has Full Stock: ${grade.has_full_stock}`);
            console.log(`      Has Any Stock: ${grade.has_any_stock}`);
            console.log('');
          });
        }
        
        // Summary
        console.log('\n📋 Summary:');
        console.log(`   • Product has photo: ${product.photo ? '✅' : '❌'}`);
        console.log(`   • Has variants: ${product.variants?.length > 0 ? '✅' : '❌'}`);
        console.log(`   • Has grades: ${product.available_grades?.length > 0 ? '✅' : '❌'}`);
        
        const variantsWithImages = product.variants?.filter(v => v.image_url) || [];
        console.log(`   • Variants with images: ${variantsWithImages.length}/${product.variants?.length || 0}`);
        
        if (variantsWithImages.length > 0) {
          console.log('   • Image URLs:');
          variantsWithImages.forEach((v, i) => {
            console.log(`     ${i + 1}. ${v.image_url}`);
          });
        }
        
      } catch (error) {
        console.error('❌ Error parsing JSON:', error.message);
        console.log('📋 Raw response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('��� Request error:', error.message);
  });

  req.setTimeout(10000, () => {
    console.log('⏰ Request timeout');
    req.destroy();
  });

  req.end();
}

testProduct649Detail();
