#!/usr/bin/env node

// Lista de tabelas baseada na análise do código
const usedTables = {
  // Produtos e Catálogo
  products: [
    "server/routes/products.ts",
    "server/routes/store-simple.ts",
    "server/routes/store.ts",
  ],
  categories: ["server/routes/categories.ts", "server/routes/store-simple.ts"],
  colors: ["server/routes/colors.ts", "server/routes/store-simple.ts"],
  sizes: ["server/routes/products.ts", "server/lib/add-sizes.ts"],
  brands: ["server/routes/products.ts"],
  types: [
    "server/lib/add-genders-types-tables.ts",
    "server/routes/store-simple.ts",
  ],
  genders: [
    "server/lib/add-genders-types-tables.ts",
    "server/routes/store-simple.ts",
  ],

  // Sistema de Variantes
  product_variants: [
    "server/routes/store-simple.ts",
    "server/routes/products.ts",
  ],
  product_color_variants: [
    "server/routes/store-simple.ts",
    "server/routes/products.ts",
  ],
  product_variant_sizes: ["server/lib/add-variant-sizes.ts"],
  variant_images: ["server/lib/add-variant-images.ts"],

  // Sistema de Grades
  grade_vendida: ["server/routes/store-simple.ts", "server/lib/add-grades.ts"],
  grade_templates: ["server/lib/add-grades.ts"],
  product_color_grades: [
    "server/routes/store-simple.ts",
    "server/lib/add-grades.ts",
  ],

  // Loja e Vendas
  customers: [
    "server/routes/customer-auth.ts",
    "server/routes/admin-customers.ts",
  ],
  customer_auth: ["server/routes/customer-auth.ts"],
  orders: ["server/routes/admin-orders.ts"],
  order_items: ["server/routes/admin-orders.ts"],

  // Sistema de Vendedores
  vendors: ["server/routes/vendors.ts"],
  vendor_commissions: [
    "server/routes/vendors.ts",
    "server/lib/add-vendor-commissions.ts",
  ],
  vendor_sessions: ["server/routes/vendors.ts"],

  // Configurações e Logs
  store_settings: ["server/lib/store-settings.ts"],
  size_groups: ["server/lib/add-size-groups.ts"],
  api_logs: ["server/lib/api-logger.ts"],
  notification_settings: ["server/lib/notification-settings.ts"],
};

// Tabelas que podem existir mas não estão sendo usadas (baseado em análise de código)
const potentiallyUnusedTables = [
  // Adicione aqui tabelas que suspeita não serem utilizadas
];

console.log("📊 ANÁLISE DE TABELAS DO SISTEMA\n");
console.log("=".repeat(50));

console.log("\n✅ TABELAS UTILIZADAS ATIVAMENTE:");
console.log(`Total: ${Object.keys(usedTables).length} tabelas\n`);

Object.entries(usedTables).forEach(([table, files]) => {
  console.log(`📋 ${table}`);
  files.forEach((file) => {
    console.log(`   └─ ${file}`);
  });
  console.log();
});

console.log("\n" + "=".repeat(50));
console.log("📝 RESUMO:");
console.log("=".repeat(50));
console.log(
  `• Tabelas identificadas como utilizadas: ${Object.keys(usedTables).length}`,
);
console.log(
  `• Tabelas possivelmente não utilizadas: ${potentiallyUnusedTables.length}`,
);

if (potentiallyUnusedTables.length > 0) {
  console.log("\n⚠️  TABELAS CANDIDATAS PARA VERIFICAÇÃO:");
  potentiallyUnusedTables.forEach((table) => {
    console.log(`   • ${table}`);
  });
  console.log("\n⚠️  RECOMENDAÇÃO: Verificar manualmente antes de remover!");
} else {
  console.log(
    "\n✅ RESULTADO: Todas as tabelas analisadas estão sendo utilizadas",
  );
  console.log("   Não foram identificadas tabelas órfãs para remoção.");
}

console.log("\n🔍 PRÓXIMOS PASSOS:");
console.log(
  "1. Execute 'SHOW TABLES' no banco para verificar se há tabelas não listadas",
);
console.log("2. Verifique se há tabelas de backup, teste ou temporárias");
console.log(
  "3. Analise tabelas com nomes como 'temp_', 'test_', 'backup_', etc.",
);
console.log(
  "4. Verifique logs de aplicação para tabelas que podem ter sido criadas dinamicamente",
);

console.log("\n💡 COMANDO SQL PARA LISTAR TODAS AS TABELAS:");
console.log("   SHOW TABLES;");

console.log("\n💡 COMANDO SQL PARA VERIFICAR TAMANHO DAS TABELAS:");
console.log(`   SELECT table_name, table_rows, data_length, index_length 
   FROM information_schema.tables 
   WHERE table_schema = 'tropical'
   ORDER BY data_length DESC;`);
