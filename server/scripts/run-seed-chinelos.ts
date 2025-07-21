import { seedChinelos } from "../lib/seed-chinelos";

async function runSeed() {
  try {
    console.log("🚀 Executando seed de chinelos...");
    await seedChinelos();
    console.log("✅ Seed executado com sucesso!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro ao executar seed:", error);
    process.exit(1);
  }
}

runSeed();
