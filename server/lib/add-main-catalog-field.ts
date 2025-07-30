import db from './db';

async function addMainCatalogField() {
  try {
    console.log('Adding is_main_catalog field to product_color_variants table...');

    // Add is_main_catalog column to product_color_variants table
    const addMainCatalogColumn = `
      ALTER TABLE product_color_variants 
      ADD COLUMN is_main_catalog BOOLEAN DEFAULT false 
      AFTER active
    `;

    await db.execute(addMainCatalogColumn);
    console.log('✓ Added is_main_catalog column to product_color_variants table');

    console.log('✓ Successfully added main catalog field');

  } catch (error) {
    console.error('Error adding main catalog field:', error);
    throw error;
  }
}

// Run migration if called directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  addMainCatalogField().catch(console.error);
}

export default addMainCatalogField;
