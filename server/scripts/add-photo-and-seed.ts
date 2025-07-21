import { addPhotoColumn } from "../lib/add-photo-column";
import { seedChinelos } from "../lib/seed-chinelos";

async function runMigrationAndSeed() {
  try {
    console.log("🔧 Adicionando coluna photo...");
    await addPhotoColumn();

    console.log("🚀 Executando seed de chinelos...");
    await seedChinelos();

    console.log("✅ Processo concluído com sucesso!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro no processo:", error);
    process.exit(1);
  }
}

runMigrationAndSeed();
