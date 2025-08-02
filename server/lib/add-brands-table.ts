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

    if ((tables as any[]).length > 0) {
      console.log("✅ Tabela 'brands' já existe");
      return;
    }

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
  } catch (error) {
    console.error("❌ Erro ao criar tabela 'brands':", error);
    throw error;
  }
}
