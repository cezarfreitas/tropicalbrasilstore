import mysql from 'mysql2/promise';

const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ecommerce'
});

async function addVendorAlias() {
  try {
    await connection.connect();
    console.log('Connected to database');

    // Add alias column to vendors table
    const addAliasColumn = `
      ALTER TABLE vendors 
      ADD COLUMN alias VARCHAR(100) UNIQUE NULL 
      AFTER name
    `;

    await connection.execute(addAliasColumn);
    console.log('✓ Added alias column to vendors table');

    // Generate aliases for existing vendors based on their names
    const vendors = await connection.execute('SELECT id, name FROM vendors');
    const vendorRows = vendors[0] as any[];

    for (const vendor of vendorRows) {
      // Create a URL-friendly alias from the vendor name
      let alias = vendor.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
        .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

      // Ensure alias is unique by adding number if needed
      let finalAlias = alias;
      let counter = 1;
      
      while (true) {
        const existingAlias = await connection.execute(
          'SELECT id FROM vendors WHERE alias = ?',
          [finalAlias]
        );
        
        if ((existingAlias[0] as any[]).length === 0) {
          break;
        }
        
        finalAlias = `${alias}-${counter}`;
        counter++;
      }

      // Update vendor with the generated alias
      await connection.execute(
        'UPDATE vendors SET alias = ? WHERE id = ?',
        [finalAlias, vendor.id]
      );
      
      console.log(`✓ Generated alias "${finalAlias}" for vendor: ${vendor.name}`);
    }

    console.log('✓ Successfully added vendor alias system');

  } catch (error) {
    console.error('Error adding vendor alias:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  addVendorAlias().catch(console.error);
}

export default addVendorAlias;
