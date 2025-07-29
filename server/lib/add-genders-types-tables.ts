import db from "./db";

export async function addGendersTypesTable() {
  console.log("🔄 Creating genders and types tables...");
  
  try {
    // Check if genders table exists
    const [gendersTableExists] = await db.execute("SHOW TABLES LIKE 'genders'");
    
    if ((gendersTableExists as any[]).length === 0) {
      // Create genders table
      await db.execute(`
        CREATE TABLE genders (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL UNIQUE,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      
      // Insert default genders
      await db.execute(`
        INSERT INTO genders (name, description) VALUES
        ('Masculino', 'Produtos direcionados ao público masculino'),
        ('Feminino', 'Produtos direcionados ao público feminino'),
        ('Unissex', 'Produtos unissex para qualquer gênero'),
        ('Infantil', 'Produtos direcionados ao público infantil')
      `);
      
      console.log("✅ Genders table created and seeded");
    } else {
      console.log("✅ Genders table already exists");
    }

    // Check if types table exists
    const [typesTableExists] = await db.execute("SHOW TABLES LIKE 'types'");
    
    if ((typesTableExists as any[]).length === 0) {
      // Create types table
      await db.execute(`
        CREATE TABLE types (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL UNIQUE,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      
      // Insert default types
      await db.execute(`
        INSERT INTO types (name, description) VALUES
        ('Chinelo', 'Chinelos tradicionais'),
        ('Sandália', 'Sandálias diversas'),
        ('Tênis', 'Cal��ados esportivos'),
        ('Papete', 'Papetes e chinelos com tiras'),
        ('Rasteirinha', 'Rasteirinhas e chinelos baixos')
      `);
      
      console.log("✅ Types table created and seeded");
    } else {
      console.log("✅ Types table already exists");
    }

    // Add gender_id and type_id columns to products table if they don't exist
    const [productsColumns] = await db.execute("SHOW COLUMNS FROM products LIKE 'gender_id'");
    if ((productsColumns as any[]).length === 0) {
      await db.execute(`
        ALTER TABLE products 
        ADD COLUMN gender_id INT,
        ADD COLUMN type_id INT,
        ADD FOREIGN KEY (gender_id) REFERENCES genders(id) ON DELETE SET NULL,
        ADD FOREIGN KEY (type_id) REFERENCES types(id) ON DELETE SET NULL
      `);
      console.log("✅ Added gender_id and type_id columns to products table");
    } else {
      console.log("✅ Gender and type columns already exist in products table");
    }

  } catch (error) {
    console.error("❌ Error creating genders and types tables:", error);
    throw error;
  }
}
