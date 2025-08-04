#!/usr/bin/env node

import { createConnection } from "mysql2/promise";

// Tabelas conhecidas como utilizadas ativamente
const ACTIVE_TABLES = {
  // Produtos e Catálogo
  products: "Produtos principais",
  categories: "Categorias dos produtos",
  colors: "Cores disponíveis",
  sizes: "Tamanhos disponíveis",
  brands: "Marcas dos produtos",
  types: "Tipos de produtos",
  genders: "Gêneros dos produtos",

  // Sistema de Variantes
  product_variants: "Variantes físicas (produto+cor+tamanho)",
  product_color_variants: "Variantes por cor (WooCommerce style)",
  product_variant_sizes: "Estoque por tamanho para cada variante",
  variant_images: "Múltiplas imagens por variante",

  // Sistema de Grades
  grade_vendida: "Grades/kits de venda",
  grade_templates: "Templates de grades (tamanho + quantidade)",
  product_color_grades: "Associação produto+cor+grade",

  // Loja e Vendas
  customers: "Clientes da loja",
  customer_auth: "Autenticação de clientes",
  orders: "Pedidos",
  order_items: "Itens dos pedidos",

  // Sistema de Vendedores
  vendors: "Vendedores/representantes",
  vendor_commissions: "Comissões dos vendedores",
  vendor_sessions: "Sessões dos vendedores",

  // Configurações e Logs
  store_settings: "Configurações da loja",
  size_groups: "Grupos de tamanhos",
  api_logs: "Logs das requisições API",
  notification_settings: "Configurações de notificações",
};

// Tabelas obsoletas conhecidas
const OBSOLETE_TABLES = {
  grade_items:
    "OBSOLETA - Substituída por grade_templates + product_color_grades",
};

async function analyzeTables() {
  console.log("🔍 ANÁLISE SEGURA DE TABELAS DO BANCO DE DADOS");
  console.log("=".repeat(60));
  console.log("⚠️  MODO SOMENTE LEITURA - Nenhuma tabela será modificada\n");

  const connection = await createConnection({
    host: "5.161.52.206",
    port: 3232,
    user: "tropical",
    password: "805ce7692e5b4d6ced5f",
    database: "tropical",
  });

  try {
    // 1. Listar todas as tabelas
    const [tables] = await connection.execute("SHOW TABLES");
    const allTables = tables.map((row) => Object.values(row)[0]);

    console.log(`📋 Total de tabelas encontradas: ${allTables.length}\n`);

    // 2. Categorizar tabelas
    const activeTables = [];
    const obsoleteTables = [];
    const unknownTables = [];

    for (const tableName of allTables) {
      if (ACTIVE_TABLES[tableName]) {
        activeTables.push(tableName);
      } else if (OBSOLETE_TABLES[tableName]) {
        obsoleteTables.push(tableName);
      } else {
        unknownTables.push(tableName);
      }
    }

    // 3. Mostrar tabelas ativas
    console.log("✅ TABELAS ATIVAS (NÃO REMOVER):");
    console.log(`Total: ${activeTables.length} tabelas\n`);

    for (const tableName of activeTables) {
      const [countResult] = await connection.execute(
        `SELECT COUNT(*) as count FROM \`${tableName}\``,
      );
      const count = countResult[0].count;
      console.log(
        `  📋 ${tableName.padEnd(25)} │ ${count.toString().padStart(8)} registros │ ${ACTIVE_TABLES[tableName]}`,
      );
    }

    // 4. Mostrar tabelas obsoletas
    if (obsoleteTables.length > 0) {
      console.log("\n❌ TABELAS OBSOLETAS (CANDIDATAS PARA REMOÇÃO):");
      console.log(`Total: ${obsoleteTables.length} tabelas\n`);

      for (const tableName of obsoleteTables) {
        try {
          const [countResult] = await connection.execute(
            `SELECT COUNT(*) as count FROM \`${tableName}\``,
          );
          const count = countResult[0].count;
          console.log(
            `  🗑️  ${tableName.padEnd(25)} │ ${count.toString().padStart(8)} registros │ ${OBSOLETE_TABLES[tableName]}`,
          );
        } catch (error) {
          console.log(
            `  🗑️  ${tableName.padEnd(25)} │     ERRO │ ${OBSOLETE_TABLES[tableName]}`,
          );
        }
      }
    }

    // 5. Mostrar tabelas desconhecidas
    if (unknownTables.length > 0) {
      console.log("\n❓ TABELAS NÃO RECONHECIDAS (VERIFICAR MANUALMENTE):");
      console.log(`Total: ${unknownTables.length} tabelas\n`);

      for (const tableName of unknownTables) {
        try {
          const [countResult] = await connection.execute(
            `SELECT COUNT(*) as count FROM \`${tableName}\``,
          );
          const count = countResult[0].count;

          // Tentar identificar o tipo da tabela pelo nome
          let possibleType = "Desconhecida";
          if (tableName.includes("temp") || tableName.includes("tmp")) {
            possibleType = "Possível tabela temporária";
          } else if (
            tableName.includes("backup") ||
            tableName.includes("bkp")
          ) {
            possibleType = "Possível backup";
          } else if (tableName.includes("test")) {
            possibleType = "Possível tabela de teste";
          } else if (tableName.includes("log")) {
            possibleType = "Possível tabela de log";
          }

          console.log(
            `  ❓ ${tableName.padEnd(25)} │ ${count.toString().padStart(8)} registros │ ${possibleType}`,
          );
        } catch (error) {
          console.log(
            `  ❓ ${tableName.padEnd(25)} │     ERRO │ Erro ao acessar`,
          );
        }
      }
    }

    // 6. Resumo e recomendações
    console.log("\n" + "=".repeat(60));
    console.log("📊 RESUMO DA ANÁLISE");
    console.log("=".repeat(60));
    console.log(`Total de tabelas: ${allTables.length}`);
    console.log(`• Tabelas ativas: ${activeTables.length}`);
    console.log(`• Tabelas obsoletas: ${obsoleteTables.length}`);
    console.log(`• Tabelas não reconhecidas: ${unknownTables.length}`);

    // 7. Comandos para remoção segura
    if (obsoleteTables.length > 0) {
      console.log("\n🗑️  COMANDOS PARA REMOÇÃO DAS TABELAS OBSOLETAS:");
      console.log("⚠️  Execute apenas após verificação manual!\n");

      obsoleteTables.forEach((tableName) => {
        console.log(`-- Remover ${tableName}`);
        console.log(`DROP TABLE IF EXISTS \`${tableName}\`;`);
      });
    }

    if (unknownTables.length > 0) {
      console.log("\n❓ TABELAS PARA INVESTIGAÇÃO MANUAL:");
      unknownTables.forEach((tableName) => {
        console.log(`-- Verificar estrutura e uso da tabela ${tableName}`);
        console.log(`DESCRIBE \`${tableName}\`;`);
        console.log(`SELECT * FROM \`${tableName}\` LIMIT 5;`);
        console.log("");
      });
    }

    console.log("\n✅ Análise concluída com segurança!");
  } catch (error) {
    console.error("💥 Erro na análise:", error.message);
  } finally {
    await connection.end();
  }
}

analyzeTables().catch(console.error);
