// Test API status and endpoints

async function testApi() {
  const baseUrl = 'https://b3d8b2c65a9545f6afe50b903dd0474d-2db40f6ea019442580663b253.fly.dev';
  
  try {
    // Test ping
    console.log('🏓 Testing ping...');
    const pingResponse = await fetch(`${baseUrl}/api/ping`);
    const pingData = await pingResponse.text();
    console.log('Ping response:', pingData);
    
    // Test products endpoint  
    console.log('\n📦 Testing products endpoint...');
    const productsResponse = await fetch(`${baseUrl}/api/products-woocommerce`);
    const productsData = await productsResponse.json();
    console.log('Products response:', JSON.stringify(productsData, null, 2));
    
    // Test bulk endpoint (just structure)
    console.log('\n🔗 Testing bulk endpoint structure...');
    const bulkResponse = await fetch(`${baseUrl}/api/products/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'dev'
      },
      body: JSON.stringify({})
    });
    console.log('Bulk response status:', bulkResponse.status);
    const bulkData = await bulkResponse.json();
    console.log('Bulk response:', JSON.stringify(bulkData, null, 2));
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testApi();
