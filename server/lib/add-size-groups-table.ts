import connection from './db';

export async function addSizeGroupsTable() {
  const db = await Database.getInstance();
  
  try {
    console.log('Creating size_groups table...');
    
    await db.execute(`
      CREATE TABLE IF NOT EXISTS size_groups (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        icon VARCHAR(10),
        sizes JSON NOT NULL,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_name (name)
      )
    `);

    // Insert default size groups
    const defaultGroups = [
      {
        name: 'Masculino',
        description: 'Tamanhos masculinos adultos',
        icon: '👨',
        sizes: JSON.stringify(['38', '39', '40', '41', '42', '43', '44']),
        active: true
      },
      {
        name: 'Feminino',
        description: 'Tamanhos femininos adultos', 
        icon: '👩',
        sizes: JSON.stringify(['33', '34', '35', '36', '37', '38', '39']),
        active: true
      },
      {
        name: 'Infantil',
        description: 'Tamanhos infantis',
        icon: '👶',
        sizes: JSON.stringify(['32', '33', '34', '35', '36']),
        active: true
      },
      {
        name: 'Todos',
        description: 'Todos os tamanhos disponíveis',
        icon: '👥',
        sizes: JSON.stringify(['32', '33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44']),
        active: true
      }
    ];

    for (const group of defaultGroups) {
      await db.execute(`
        INSERT IGNORE INTO size_groups (name, description, icon, sizes, active)
        VALUES (?, ?, ?, ?, ?)
      `, [group.name, group.description, group.icon, group.sizes, group.active]);
    }

    console.log('✓ size_groups table created and seeded with default groups');
  } catch (error) {
    console.error('✗ Error creating size_groups table:', error);
    throw error;
  }
}
