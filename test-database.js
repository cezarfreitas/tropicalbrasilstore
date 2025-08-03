// Test database connectivity
const mysql = require('mysql2/promise');

const DATABASE_URL = 'mysql://tropical:805ce7692e5b4d6ced5f@5.161.52.206:3232/tropical';

async function testDatabase() {
  console.log('🔍 Testing database connectivity...');
  console.log('📋 Database URL:', DATABASE_URL.replace(/:[^:@]*@/, ':***@'));
  
  try {
    const connection = await mysql.createConnection(DATABASE_URL);
    console.log('✅ Database connection successful!');
    
    // Test a simple query
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Query test successful:', rows);
    
    // Show database info
    const [info] = await connection.execute('SELECT DATABASE() as current_db, VERSION() as version');
    console.log('📊 Database info:', info[0]);
    
    await connection.end();
    console.log('✅ Connection closed successfully');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

testDatabase();
