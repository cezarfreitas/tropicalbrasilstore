import db from "../lib/db";

const newChinelos = [
  {
    name: "Chinelo Havaianas Brasil Collection Premium",
    description: "Edição especial com as cores da bandeira brasileira, premium quality.",
    base_price: 45.90,
    suggested_price: 65.00,
    sku: "HAV-BRASIL-PREM-101",
    photo: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=400&h=400&fit=crop",
    category_id: 1,
    active: true
  },
  {
    name: "Chinelo Olympikus Comfort Max",
    description: "Tecnologia de amortecimento para máximo conforto durante todo o dia.",
    base_price: 38.90,
    suggested_price: 52.00,
    sku: "OLY-COMFORT-102",
    photo: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=400&h=400&fit=crop",
    category_id: 1,
    active: true
  },
  {
    name: "Chinelo Kenner Action Gel",
    description: "Solado com tecnologia gel para absorção de impacto.",
    base_price: 42.90,
    suggested_price: 58.00,
    sku: "KEN-ACTION-103",
    photo: "https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=400&h=400&fit=crop",
    category_id: 1,
    active: true
  },
  {
    name: "Chinelo Ipanema Tropical Collection",
    description: "Estampas tropicais vibrantes, perfeito para o verão brasileiro.",
    base_price: 29.90,
    suggested_price: 42.00,
    sku: "IPA-TROPICAL-104",
    photo: "https://images.unsplash.com/photo-1524863479829-916d8e77f114?w=400&h=400&fit=crop",
    category_id: 1,
    active: true
  },
  {
    name: "Chinelo Rider Street Style Urban",
    description: "Design urbano moderno com solado antiderrapante de alta performance.",
    base_price: 47.90,
    suggested_price: 62.00,
    sku: "RID-URBAN-105",
    photo: "https://images.unsplash.com/photo-1544441892-794166f1e3be?w=400&h=400&fit=crop",
    category_id: 1,
    active: true
  },
  {
    name: "Chinelo Grendene Kids Cartoon",
    description: "Chinelo infantil com personagens animados, material hipoalergênico.",
    base_price: 22.90,
    suggested_price: 32.00,
    sku: "GRE-KIDS-106",
    photo: "https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=400&h=400&fit=crop",
    category_id: 1,
    active: true
  },
  {
    name: "Chinelo Azaleia Fashion Metallic",
    description: "Acabamento metalizado sofisticado, ideal para ocasiões especiais.",
    base_price: 52.90,
    suggested_price: 72.00,
    sku: "AZA-METALLIC-107",
    photo: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=400&h=400&fit=crop",
    category_id: 1,
    active: true
  },
  {
    name: "Chinelo Dupé Eco Friendly",
    description: "100% sustentável, feito com materiais reciclados e biodegradáveis.",
    base_price: 39.90,
    suggested_price: 55.00,
    sku: "DUP-ECO-108",
    photo: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=400&h=400&fit=crop",
    category_id: 1,
    active: true
  },
  {
    name: "Chinelo Zaxy Crystal Collection",
    description: "Transparência cristalina com brilhos, elegância e modernidade.",
    base_price: 48.90,
    suggested_price: 68.00,
    sku: "ZAX-CRYSTAL-109",
    photo: "https://images.unsplash.com/photo-1524863479829-916d8e77f114?w=400&h=400&fit=crop",
    category_id: 1,
    active: true
  },
  {
    name: "Chinelo Havaianas Slim Velvet",
    description: "Textura aveludada premium com tiras mais finas e delicadas.",
    base_price: 55.90,
    suggested_price: 78.00,
    sku: "HAV-VELVET-110",
    photo: "https://images.unsplash.com/photo-1544441892-794166f1e3be?w=400&h=400&fit=crop",
    category_id: 1,
    active: true
  }
];

export async function addNewChinelos() {
  try {
    console.log("🚀 Iniciando inserção de 10 novos produtos de chinelo...");

    for (let i = 0; i < newChinelos.length; i++) {
      const chinelo = newChinelos[i];
      
      console.log(`📦 Inserindo produto ${i + 1}/10: ${chinelo.name}`);

      const [result] = await db.execute(
        `INSERT INTO products (name, description, base_price, suggested_price, sku, photo, category_id, active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          chinelo.name,
          chinelo.description,
          chinelo.base_price,
          chinelo.suggested_price,
          chinelo.sku,
          chinelo.photo,
          chinelo.category_id,
          chinelo.active
        ]
      );

      console.log(`✅ Produto inserido com ID: ${(result as any).insertId}`);
    }

    console.log("🎉 Todos os 10 produtos foram inseridos com sucesso!");
    return true;
  } catch (error) {
    console.error("❌ Erro ao inserir produtos:", error);
    throw error;
  }
}

// Execute the function directly
addNewChinelos()
  .then(() => {
    console.log("Script concluído!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Erro no script:", error);
    process.exit(1);
  });
