const mysql = require('mysql2/promise');

async function runMigration() {
  let connection;
  
  try {
    // Database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'chinelos_db',
      multipleStatements: true
    });

    console.log('🔗 Connected to database');

    // Check which design columns already exist
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'store_settings' 
      AND TABLE_SCHEMA = DATABASE()
      AND COLUMN_NAME IN ('primary_color', 'secondary_color', 'accent_color', 'background_color', 'text_color')
    `);

    const existingColumns = columns.map(col => col.COLUMN_NAME);
    const requiredColumns = [
      { name: 'primary_color', default: '#f97316' },
      { name: 'secondary_color', default: '#ea580c' },
      { name: 'accent_color', default: '#fed7aa' },
      { name: 'background_color', default: '#ffffff' },
      { name: 'text_color', default: '#1f2937' }
    ];

    for (const column of requiredColumns) {
      if (!existingColumns.includes(column.name)) {
        console.log(`📦 Adding ${column.name} column to store_settings table...`);
        
        await connection.execute(`
          ALTER TABLE store_settings 
          ADD COLUMN ${column.name} VARCHAR(7) DEFAULT '${column.default}'
        `);
        
        console.log(`✅ ${column.name} column added successfully`);
      } else {
        console.log(`ℹ️ ${column.name} column already exists`);
      }
    }

    console.log("✅ All design columns are ready!");
    
  } catch (error) {
    console.error("❌ Error adding design columns:", error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigration();
