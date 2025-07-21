import { createServer } from '../index';

const app = createServer();
const port = 3001;

console.log('Starting debug server...');

app.listen(port, () => {
  console.log(`Debug server running on port ${port}`);
  console.log('Testing API endpoints:');
  
  // Test the endpoints
  setTimeout(async () => {
    try {
      const response = await fetch(`http://localhost:${port}/api/store/products-paginated?page=1&limit=5`);
      const data = await response.json();
      console.log('✅ API fetch successful:', { 
        status: response.status,
        productCount: data.products?.length || 0 
      });
    } catch (error) {
      console.error('❌ API fetch failed:', error);
    }
    
    process.exit(0);
  }, 1000);
});
