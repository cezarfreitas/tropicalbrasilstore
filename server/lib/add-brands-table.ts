import db from "./db";

export async function addBrandsTable() {
  try {
    // Verificar se a tabela já existe
    const [tables] = await db.execute(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
      AND table_name = 'brands'
    `);

    let brandsTableExists = (tables as any[]).length > 0;

    if (!brandsTableExists) {
      // Criar tabela brands
      await db.execute(`
        CREATE TABLE brands (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_brands_name (name)
        )
      `);

      // Inserir algumas marcas padrão
      const defaultBrands = [
        { name: "Havaianas", description: "Marca líder em chinelos no Brasil" },
        { name: "Ipanema", description: "Chinelos modernos e sustentáveis" },
        { name: "Melissa", description: "Chinelos de designer" },
        { name: "Rider", description: "Chinelos masculinos esportivos" },
        { name: "Grendene", description: "Fabricante nacional de calçados" },
      ];

      for (const brand of defaultBrands) {
        await db.execute(
          "INSERT INTO brands (name, description) VALUES (?, ?)",
          [brand.name, brand.description]
        );
      }

      console.log("✅ Tabela 'brands' criada com sucesso");
    } else {
      console.log("✅ Tabela 'brands' já existe");
    }

    // Verificar se a coluna brand_id existe na tabela products
    const [columns] = await db.execute(`
      SELECT COLUMN_NAME
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
      AND table_name = 'products'
      AND column_name = 'brand_id'
    `);

    if ((columns as any[]).length === 0) {
      // Adicionar coluna brand_id na tabela products
      await db.execute(`
        ALTER TABLE products
        ADD COLUMN brand_id INT NULL,
        ADD FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL
      `);
      console.log("✅ Coluna 'brand_id' adicionada à tabela 'products'");
    } else {
      console.log("✅ Coluna 'brand_id' já existe na tabela 'products'");
    }

  } catch (error) {
    console.error("❌ Erro ao criar tabela 'brands' ou adicionar coluna brand_id:", error);
    throw error;
  }
}
