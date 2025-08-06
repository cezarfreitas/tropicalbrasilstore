const mysql = require('mysql2/promise');

async function checkSettingsTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root', 
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'ecommerce'
  });

  try {
    // Check table structure
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, COLUMN_DEFAULT, IS_NULLABLE, DATA_TYPE
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'store_settings'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('Store settings table structure:');
    columns.forEach(col => {
      console.log(`- ${col.COLUMN_NAME}: ${col.DATA_TYPE} (default: ${col.COLUMN_DEFAULT}, nullable: ${col.IS_NULLABLE})`);
    });

    // Check current settings
    const [settings] = await connection.execute('SELECT * FROM store_settings LIMIT 1');
    console.log('\nCurrent settings:');
    if (settings.length > 0) {
      console.log(JSON.stringify(settings[0], null, 2));
    } else {
      console.log('No settings found');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkSettingsTable();
