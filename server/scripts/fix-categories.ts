import db from "../lib/db";

async function fixCategories() {
  try {
    console.log("Removendo categoria duplicada com encoding corrompido...");
    
    // Remover a categoria com ID 14 que tem encoding corrompido
    const [result] = await db.execute("DELETE FROM categories WHERE id = 14 AND name = 'Sand��lias'");
    console.log("Categoria com encoding corrompido removida:", result);
    
    // Verificar se existe a categoria "Teste" e removê-la se necessário
    const [testResult] = await db.execute("DELETE FROM categories WHERE name = 'Teste'");
    if ((testResult as any).affectedRows > 0) {
      console.log("Categoria de teste removida");
    }
    
    // Verificar categorias restantes
    const [rows] = await db.execute("SELECT * FROM categories ORDER BY name");
    console.log("Categorias após limpeza:");
    console.table(rows);
    
  } catch (error) {
    console.error("Erro ao corrigir categorias:", error);
  } finally {
    await db.end();
  }
}

fixCategories();
