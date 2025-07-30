import db from './db';

async function addVariantImagesTable() {
  try {
    console.log('Creating variant_images table...');

    // Create variant_images table
    const createVariantImagesTable = `
      CREATE TABLE IF NOT EXISTS variant_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        color_variant_id INT NOT NULL,
        image_url VARCHAR(500) NOT NULL,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (color_variant_id) REFERENCES product_color_variants(id) ON DELETE CASCADE,
        INDEX idx_color_variant_id (color_variant_id),
        INDEX idx_display_order (display_order)
      ) ENGINE=InnoDB CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    await db.execute(createVariantImagesTable);
    console.log('✓ Created variant_images table');

    // Migrate existing image_url to variant_images table
    console.log('Migrating existing variant images...');
    
    const [existingVariants] = await db.execute(`
      SELECT id, image_url 
      FROM product_color_variants 
      WHERE image_url IS NOT NULL AND image_url != ''
    `);

    const variantRows = existingVariants as any[];
    for (const variant of variantRows) {
      await db.execute(`
        INSERT INTO variant_images (color_variant_id, image_url, display_order)
        VALUES (?, ?, 0)
      `, [variant.id, variant.image_url]);
      
      console.log(`✓ Migrated image for variant ID ${variant.id}`);
    }

    console.log('✓ Successfully created variant images system');

  } catch (error) {
    console.error('Error adding variant images table:', error);
    throw error;
  }
}

// Run migration if called directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  addVariantImagesTable().catch(console.error);
}

export default addVariantImagesTable;
