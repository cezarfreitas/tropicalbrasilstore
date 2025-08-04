#!/usr/bin/env node

import { createConnection } from "mysql2/promise";
import fs from "fs";
import path from "path";

async function verifyTableUsage() {
  console.log("🔍 Verificando uso de tabelas no banco de dados...\n");

  const connection = await createConnection({
    host: "5.161.52.206",
    port: 3232,
    user: "tropical",
    password: "805ce7692e5b4d6ced5f",
    database: "tropical",
  });

  try {
    // 1. Listar todas as tabelas do banco
    const [tables] = await connection.execute("SHOW TABLES");
    const tableNames = tables.map((row) => Object.values(row)[0]);

    console.log("📋 Tabelas encontradas no banco:");
    tableNames.forEach((table, index) => {
      console.log(`  ${index + 1}. ${table}`);
    });

    console.log(`\nTotal: ${tableNames.length} tabelas\n`);

    // 2. Verificar contagem de registros em cada tabela
    console.log("📊 Contagem de registros por tabela:");
    const tableStats = [];

    for (const tableName of tableNames) {
      try {
        const [countResult] = await connection.execute(
          `SELECT COUNT(*) as count FROM \`${tableName}\``,
        );
        const count = countResult[0].count;
        tableStats.push({ table: tableName, count });
        console.log(`  ${tableName}: ${count} registros`);
      } catch (error) {
        console.log(`  ${tableName}: ERRO - ${error.message}`);
      }
    }

    // 3. Identificar tabelas vazias
    const emptyTables = tableStats.filter((stat) => stat.count === 0);
    if (emptyTables.length > 0) {
      console.log("\n⚠️  Tabelas vazias (candidatas para remoção):");
      emptyTables.forEach((table) => {
        console.log(`  - ${table.table} (0 registros)`);
      });
    } else {
      console.log("\n✅ Nenhuma tabela vazia encontrada");
    }

    // 4. Verificar tabelas com poucos registros (possíveis candidatas)
    const lowDataTables = tableStats.filter(
      (stat) => stat.count > 0 && stat.count < 5,
    );
    if (lowDataTables.length > 0) {
      console.log(
        "\n🔍 Tabelas com poucos registros (verificar se são necessárias):",
      );
      lowDataTables.forEach((table) => {
        console.log(`  - ${table.table} (${table.count} registros)`);
      });
    }

    // 5. Procurar por referências no código
    console.log("\n🔍 Verificando uso no código...");

    const serverFiles = getServerFiles();
    const tableUsage = {};

    tableNames.forEach((tableName) => {
      tableUsage[tableName] = [];
    });

    // Buscar referências em arquivos do servidor
    serverFiles.forEach((filePath) => {
      const content = fs.readFileSync(filePath, "utf8");

      tableNames.forEach((tableName) => {
        // Buscar por diferentes padrões de uso da tabela
        const patterns = [
          new RegExp(`FROM\\s+\`?${tableName}\`?`, "gi"),
          new RegExp(`JOIN\\s+\`?${tableName}\`?`, "gi"),
          new RegExp(`UPDATE\\s+\`?${tableName}\`?`, "gi"),
          new RegExp(`INSERT\\s+INTO\\s+\`?${tableName}\`?`, "gi"),
          new RegExp(`DELETE\\s+FROM\\s+\`?${tableName}\`?`, "gi"),
          new RegExp(`CREATE\\s+TABLE\\s+\`?${tableName}\`?`, "gi"),
          new RegExp(`DROP\\s+TABLE\\s+\`?${tableName}\`?`, "gi"),
        ];

        patterns.forEach((pattern) => {
          if (pattern.test(content)) {
            const relativePath = path.relative(process.cwd(), filePath);
            if (!tableUsage[tableName].includes(relativePath)) {
              tableUsage[tableName].push(relativePath);
            }
          }
        });
      });
    });

    // 6. Reportar tabelas não utilizadas no código
    console.log("\n📝 Análise de uso no código:");
    const unusedTables = [];

    tableNames.forEach((tableName) => {
      const files = tableUsage[tableName];
      if (files.length === 0) {
        unusedTables.push(tableName);
        console.log(`❌ ${tableName}: NÃO UTILIZADA`);
      } else {
        console.log(`✅ ${tableName}: utilizada em ${files.length} arquivo(s)`);
        files.forEach((file) => {
          console.log(`    - ${file}`);
        });
      }
    });

    // 7. Resumo final
    console.log("\n" + "=".repeat(60));
    console.log("📊 RESUMO DA ANÁLISE");
    console.log("=".repeat(60));
    console.log(`Total de tabelas: ${tableNames.length}`);
    console.log(`Tabelas vazias: ${emptyTables.length}`);
    console.log(`Tabelas não utilizadas no código: ${unusedTables.length}`);

    if (unusedTables.length > 0) {
      console.log("\n🗑️  TABELAS CANDIDATAS PARA REMOÇÃO:");
      unusedTables.forEach((table) => {
        const stats = tableStats.find((s) => s.table === table);
        console.log(`  - ${table} (${stats ? stats.count : "N/A"} registros)`);
      });

      console.log("\n⚠️  ATENÇÃO: Verifique manualmente antes de remover!");
      console.log(
        "Algumas tabelas podem ser usadas dinamicamente ou em queries construídas em runtime.",
      );
    } else {
      console.log("\n✅ RESULTADO: Todas as tabelas estão sendo utilizadas");
      console.log("Não há tabelas seguras para remoção.");
    }
  } catch (error) {
    console.error("💥 Erro na análise:", error.message);
  } finally {
    await connection.end();
  }
}

function getServerFiles() {
  const serverDir = path.join(process.cwd(), "server");
  const files = [];

  function scanDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    entries.forEach((entry) => {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        scanDirectory(fullPath);
      } else if (
        entry.isFile() &&
        (entry.name.endsWith(".ts") || entry.name.endsWith(".js"))
      ) {
        files.push(fullPath);
      }
    });
  }

  if (fs.existsSync(serverDir)) {
    scanDirectory(serverDir);
  }

  return files;
}

verifyTableUsage().catch(console.error);
