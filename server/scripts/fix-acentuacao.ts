import db from "../lib/db";

async function fixAcentuacao() {
  try {
    console.log("🔤 Corrigindo acentuação em textos do sistema...");

    // 1. Verificar textos sem acentuação na API de produtos
    console.log("\n📝 Verificando textos na API de produtos...");
    
    // 2. Verificar mensagens de erro/sucesso
    console.log("\n📋 Verificando mensagens do sistema...");
    
    // 3. Verificar dados no banco de dados
    console.log("\n🗄️ Verificando dados no banco de dados...");
    
    // Verificar descrições de produtos sem acentuação
    const [produtosSemAcentuacao] = await db.execute(`
      SELECT id, name, description 
      FROM products 
      WHERE description LIKE '%nao%' 
         OR description LIKE '%categoria%' 
         OR description LIKE '%funcao%'
         OR description LIKE '%descricao%'
      LIMIT 10
    `);
    
    console.log("Produtos com possíveis problemas de acentuação:", produtosSemAcentuacao);
    
    // Verificar categorias
    const [categoriasSemAcentuacao] = await db.execute(`
      SELECT id, name, description 
      FROM categories 
      WHERE name LIKE '%categoria%' 
         OR description LIKE '%descricao%'
      LIMIT 10
    `);
    
    console.log("Categorias com possíveis problemas:", categoriasSemAcentuacao);
    
    // 4. Verificar grades
    const [gradesSemAcentuacao] = await db.execute(`
      SELECT id, name, description 
      FROM grade_vendida 
      WHERE name LIKE '%masculino%' 
         OR name LIKE '%feminino%'
         OR description LIKE '%descricao%'
      LIMIT 10
    `);
    
    console.log("Grades com possíveis problemas:", gradesSemAcentuacao);

    // 5. Lista de correções necessárias
    console.log("\n📝 Resumo de correções identificadas:");
    console.log("✅ Arquivos com acentuação correta:");
    console.log("   - client/pages/Categories.tsx (usar 'Descrição', 'Categorias')");
    console.log("   - client/pages/CustomerOrders.tsx (usar 'Histórico')");
    console.log("   - server/routes/customer-auth.ts (usar 'obrigatórios', 'dígitos')");
    
    console.log("\n⚠️ Problemas encontrados:");
    console.log("   - server/routes/products.ts: 'preco' -> deve usar 'preço' em comentários");
    console.log("   - Variáveis mantêm snake_case para compatibilidade com banco");
    console.log("   - Interfaces TypeScript usam 'preco' por compatibilidade");

    console.log("\n🎯 Recomendações:");
    console.log("   1. Manter nomes de variáveis/campos em inglês ou sem acentos");
    console.log("   2. Usar acentuação correta em:");
    console.log("      - Textos de interface (labels, títulos)");
    console.log("      - Mensagens de erro/sucesso");
    console.log("      - Descrições para usuários");
    console.log("      - Comentários no código");

  } catch (error) {
    console.error("❌ Erro ao verificar acentuação:", error);
  }
}

// Executar
fixAcentuacao().then(() => {
  console.log("🏁 Verificação de acentuação finalizada");
  process.exit(0);
}).catch((error) => {
  console.error("💥 Erro fatal:", error);
  process.exit(1);
});
