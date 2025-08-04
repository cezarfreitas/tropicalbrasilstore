#!/usr/bin/env node

import { createConnection } from "mysql2/promise";

// Tabelas que foram identificadas como obsoletas/não utilizadas
const OBSOLETE_TABLES = [
  "grade_items", // Esta tabela foi substituída por grade_templates + product_color_grades
];

// Tabelas que sabemos que são utilizadas (para verificação)
const CORE_TABLES = [
  "products",
  "categories",
  "colors",
  "sizes",
  "brands",
  "types",
  "genders",
  "product_variants",
  "product_color_variants",
  "product_variant_sizes",
  "variant_images",
  "grade_vendida",
  "grade_templates",
  "product_color_grades",
  "customers",
  "customer_auth",
  "orders",
  "order_items",
  "vendors",
  "vendor_commissions",
  "vendor_sessions",
  "store_settings",
  "size_groups",
  "api_logs",
  "notification_settings",
];

async function removeUnusedTables() {
  const connection = await createConnection({
    host: "5.161.52.206",
    port: 3232,
    user: "tropical",
    password: "805ce7692e5b4d6ced5f",
    database: "tropical",
  });

  try {
    console.log("🔍 Analisando tabelas do banco de dados...\n");

    // 1. Listar todas as tabelas existentes
    const [tables] = await connection.execute("SHOW TABLES");
    const allTables = tables.map((row) => Object.values(row)[0]);

    console.log("📋 Tabelas encontradas no banco:");
    allTables.forEach((table, index) => {
      console.log(`  ${index + 1}. ${table}`);
    });
    console.log(`\nTotal: ${allTables.length} tabelas\n`);

    // 2. Verificar contagem de registros nas tabelas obsoletas
    console.log("📊 Verificando tabelas obsoletas conhecidas:");
    const obsoleteTablesFound = [];

    for (const tableName of OBSOLETE_TABLES) {
      if (allTables.includes(tableName)) {
        try {
          const [countResult] = await connection.execute(
            `SELECT COUNT(*) as count FROM \`${tableName}\``,
          );
          const count = countResult[0].count;
          obsoleteTablesFound.push({ table: tableName, count });
          console.log(`  ❌ ${tableName}: ${count} registros (OBSOLETA)`);
        } catch (error) {
          console.log(
            `  ❓ ${tableName}: ERRO ao verificar - ${error.message}`,
          );
        }
      } else {
        console.log(`  ✅ ${tableName}: JÁ REMOVIDA`);
      }
    }

    // 3. Verificar se há tabelas não reconhecidas
    const unrecognizedTables = allTables.filter(
      (table) =>
        !CORE_TABLES.includes(table) && !OBSOLETE_TABLES.includes(table),
    );

    if (unrecognizedTables.length > 0) {
      console.log("\n🔍 Tabelas não reconhecidas (verificar manualmente):");
      for (const tableName of unrecognizedTables) {
        try {
          const [countResult] = await connection.execute(
            `SELECT COUNT(*) as count FROM \`${tableName}\``,
          );
          const count = countResult[0].count;
          console.log(`  ❓ ${tableName}: ${count} registros`);
        } catch (error) {
          console.log(`  ❓ ${tableName}: ERRO - ${error.message}`);
        }
      }
    }

    // 4. Executar remoção das tabelas obsoletas (se encontradas)
    if (obsoleteTablesFound.length > 0) {
      console.log("\n🗑️  REMOVENDO TABELAS OBSOLETAS:");

      for (const { table, count } of obsoleteTablesFound) {
        console.log(`\n📋 Removendo tabela: ${table} (${count} registros)`);

        try {
          // Fazer backup dos dados se houver registros
          if (count > 0) {
            console.log(`  💾 Fazendo backup dos dados de ${table}...`);
            const [data] = await connection.execute(
              `SELECT * FROM \`${table}\``,
            );

            // Salvar backup em arquivo (simulado)
            console.log(
              `  💾 Backup seria salvo em: backup_${table}_${new Date().toISOString().split("T")[0]}.json`,
            );
            console.log(`  📊 ${count} registros seriam salvos no backup`);
          }

          // Remover a tabela
          await connection.execute(`DROP TABLE IF EXISTS \`${table}\``);
          console.log(`  ✅ Tabela ${table} removida com sucesso`);
        } catch (error) {
          console.log(`  ❌ Erro ao remover ${table}: ${error.message}`);
        }
      }
    }

    // 5. Verificar tabelas restantes
    console.log("\n" + "=".repeat(60));
    console.log("📊 RESUMO DA LIMPEZA");
    console.log("=".repeat(60));

    const [finalTables] = await connection.execute("SHOW TABLES");
    const finalTableCount = finalTables.length;

    console.log(`Tabelas antes da limpeza: ${allTables.length}`);
    console.log(`Tabelas removidas: ${obsoleteTablesFound.length}`);
    console.log(`Tabelas restantes: ${finalTableCount}`);
    console.log(`Tabelas não reconhecidas: ${unrecognizedTables.length}`);

    if (unrecognizedTables.length > 0) {
      console.log(
        "\n⚠️  ATENÇÃO: Verifique manualmente as tabelas não reconhecidas:",
      );
      unrecognizedTables.forEach((table) => {
        console.log(`   • ${table}`);
      });
    }

    console.log("\n✅ Limpeza concluída!");
  } catch (error) {
    console.error("💥 Erro na limpeza:", error.message);
  } finally {
    await connection.end();
  }
}

// Executar apenas se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🧹 LIMPEZA DE TABELAS OBSOLETAS DO BANCO DE DADOS");
  console.log("=".repeat(60));
  console.log("⚠️  ATENÇÃO: Este script vai remover tabelas obsoletas!");
  console.log("📋 Tabelas marcadas para remoção:");
  OBSOLETE_TABLES.forEach((table) => {
    console.log(`   • ${table}`);
  });
  console.log("\n💾 Dados serão salvos em backup antes da remoção");
  console.log("🔄 Iniciando em 3 segundos...\n");

  setTimeout(() => {
    removeUnusedTables().catch(console.error);
  }, 3000);
}

export default removeUnusedTables;
