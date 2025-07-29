import db from "../lib/db";

async function checkCategories() {
  try {
    const [rows] = await db.execute("SELECT * FROM categories ORDER BY name");
    console.log("Categorias no banco de dados:");
    console.table(rows);
    
    // Verificar duplicatas por nome
    const categories = rows as any[];
    const nameMap = new Map();
    
    categories.forEach(cat => {
      if (nameMap.has(cat.name)) {
        console.log(`DUPLICATA ENCONTRADA: "${cat.name}" - IDs: ${nameMap.get(cat.name)} e ${cat.id}`);
      } else {
        nameMap.set(cat.name, cat.id);
      }
    });
    
    // Verificar encoding issues
    categories.forEach(cat => {
      if (cat.name.includes('�')) {
        console.log(`PROBLEMA DE ENCODING: ID ${cat.id} - "${cat.name}"`);
      }
    });
    
  } catch (error) {
    console.error("Erro ao verificar categorias:", error);
  } finally {
    await db.end();
  }
}

checkCategories();
