import db from "../lib/db";

const photoTemplates = [
  "https://picsum.photos/400/400?random=1",
  "https://picsum.photos/400/400?random=2",
  "https://picsum.photos/400/400?random=3",
  "https://picsum.photos/400/400?random=4",
  "https://picsum.photos/400/400?random=5",
  "https://picsum.photos/400/400?random=6",
  "https://picsum.photos/400/400?random=7",
  "https://picsum.photos/400/400?random=8",
  "https://picsum.photos/400/400?random=9",
  "https://picsum.photos/400/400?random=10",
  "https://picsum.photos/400/400?random=11",
  "https://picsum.photos/400/400?random=12",
  "https://picsum.photos/400/400?random=13",
  "https://picsum.photos/400/400?random=14",
  "https://picsum.photos/400/400?random=15",
  "https://picsum.photos/400/400?random=16",
  "https://picsum.photos/400/400?random=17",
  "https://picsum.photos/400/400?random=18",
  "https://picsum.photos/400/400?random=19",
  "https://picsum.photos/400/400?random=20",
  "https://picsum.photos/400/400?random=21",
  "https://picsum.photos/400/400?random=22",
  "https://picsum.photos/400/400?random=23",
  "https://picsum.photos/400/400?random=24",
  "https://picsum.photos/400/400?random=25",
  "https://picsum.photos/400/400?random=26",
  "https://picsum.photos/400/400?random=27",
  "https://picsum.photos/400/400?random=28",
  "https://picsum.photos/400/400?random=29",
  "https://picsum.photos/400/400?random=30",
  "https://picsum.photos/400/400?random=31",
  "https://picsum.photos/400/400?random=32",
  "https://picsum.photos/400/400?random=33",
  "https://picsum.photos/400/400?random=34",
  "https://picsum.photos/400/400?random=35",
  "https://picsum.photos/400/400?random=36",
  "https://picsum.photos/400/400?random=37",
  "https://picsum.photos/400/400?random=38",
  "https://picsum.photos/400/400?random=39",
  "https://picsum.photos/400/400?random=40",
  "https://picsum.photos/400/400?random=41",
  "https://picsum.photos/400/400?random=42",
  "https://picsum.photos/400/400?random=43",
  "https://picsum.photos/400/400?random=44",
  "https://picsum.photos/400/400?random=45",
  "https://picsum.photos/400/400?random=46",
  "https://picsum.photos/400/400?random=47",
  "https://picsum.photos/400/400?random=48",
  "https://picsum.photos/400/400?random=49",
  "https://picsum.photos/400/400?random=50",
];

async function fixPhotos() {
  try {
    console.log("🔧 Corrigindo URLs das fotos dos produtos...");

    // Get all products with photos
    const [products] = await db.execute(
      "SELECT id, name FROM products WHERE photo IS NOT NULL ORDER BY id",
    );

    console.log(
      `📦 Encontrados ${(products as any[]).length} produtos com fotos`,
    );

    for (let i = 0; i < (products as any[]).length; i++) {
      const product = (products as any[])[i];
      const newPhotoUrl = photoTemplates[i % photoTemplates.length];

      await db.execute("UPDATE products SET photo = ? WHERE id = ?", [
        newPhotoUrl,
        product.id,
      ]);

      console.log(`✅ ${i + 1}/${(products as any[]).length}: ${product.name}`);
    }

    console.log("✅ URLs das fotos corrigidas com sucesso!");

    // Verify the update
    console.log("\n🔍 Verificando algumas fotos atualizadas:");
    const [updated] = await db.execute(
      "SELECT id, name, photo FROM products WHERE photo IS NOT NULL LIMIT 5",
    );
    console.table(updated);

    process.exit(0);
  } catch (error) {
    console.error("❌ Erro ao corrigir fotos:", error);
    process.exit(1);
  }
}

fixPhotos();
