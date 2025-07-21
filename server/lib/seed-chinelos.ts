import db from "./db";

const chinelos = [
  {
    name: "Chinelo Havaianas Tradicional",
    description: "O clássico chinelo brasileiro, confortável e durável para o dia a dia.",
    base_price: 25.90,
    suggested_price: 35.00,
    sku: "HAV-TRAD-001",
    photo: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=400&h=400&fit=crop"
  },
  {
    name: "Chinelo Havaianas Top",
    description: "Versão premium do clássico com acabamento diferenciado.",
    base_price: 32.90,
    suggested_price: 42.00,
    sku: "HAV-TOP-002",
    photo: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=400&h=400&fit=crop"
  },
  {
    name: "Chinelo Ipanema Gisele Bündchen",
    description: "Coleção assinada pela top model, com design exclusivo.",
    base_price: 28.90,
    suggested_price: 38.00,
    sku: "IPA-GISELE-003",
    photo: "https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=400&h=400&fit=crop"
  },
  {
    name: "Chinelo Rider Energy",
    description: "Tecnologia antiderrapante para maior segurança e conforto.",
    base_price: 35.90,
    suggested_price: 45.00,
    sku: "RID-ENERGY-004",
    photo: "https://images.unsplash.com/photo-1524863479829-916d8e77f114?w=400&h=400&fit=crop"
  },
  {
    name: "Chinelo Melissa Beach Slide",
    description: "Chinelo de plástico reciclado com fragrância exclusiva.",
    base_price: 55.90,
    suggested_price: 75.00,
    sku: "MEL-BEACH-005",
    photo: "https://images.unsplash.com/photo-1544441892-794166f1e3be?w=400&h=400&fit=crop"
  },
  {
    name: "Chinelo Adidas Adilette",
    description: "Design esportivo com tecnologia de amortecimento.",
    base_price: 89.90,
    suggested_price: 120.00,
    sku: "ADI-ADILETTE-006",
    photo: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop"
  },
  {
    name: "Chinelo Nike Benassi",
    description: "Chinelo clássico da Nike com logo bordado.",
    base_price: 75.90,
    suggested_price: 95.00,
    sku: "NIKE-BENASSI-007",
    photo: "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=400&h=400&fit=crop"
  },
  {
    name: "Chinelo Havaianas Brasil",
    description: "Edição especial com as cores da bandeira brasileira.",
    base_price: 29.90,
    suggested_price: 39.00,
    sku: "HAV-BRASIL-008",
    photo: "https://images.unsplash.com/photo-1472887743288-0150ba830cab?w=400&h=400&fit=crop"
  },
  {
    name: "Chinelo Ipanema Anatomic",
    description: "Design anatômico que se adapta perfeitamente aos pés.",
    base_price: 33.90,
    suggested_price: 43.00,
    sku: "IPA-ANATOMIC-009",
    photo: "https://images.unsplash.com/photo-1520256862855-398228c41684?w=400&h=400&fit=crop"
  },
  {
    name: "Chinelo Rider Brasil II",
    description: "Modelo inspirado na seleção brasileira de futebol.",
    base_price: 38.90,
    suggested_price: 48.00,
    sku: "RID-BRASIL-010",
    photo: "https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=400&h=400&fit=crop"
  },
  {
    name: "Chinelo Havaianas Slim",
    description: "Versão feminina com tiras mais finas e delicadas.",
    base_price: 31.90,
    suggested_price: 41.00,
    sku: "HAV-SLIM-011",
    photo: "https://images.unsplash.com/photo-1603487742131-4160ec999306?w=400&h=400&fit=crop"
  },
  {
    name: "Chinelo Kenner Rhaco Adapt",
    description: "Tecnologia adaptável que se molda ao formato do pé.",
    base_price: 42.90,
    suggested_price: 55.00,
    sku: "KEN-RHACO-012",
    photo: "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=400&h=400&fit=crop"
  },
  {
    name: "Chinelo Cartago Dakar",
    description: "Resistente e confortável para atividades ao ar livre.",
    base_price: 27.90,
    suggested_price: 37.00,
    sku: "CAR-DAKAR-013",
    photo: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop"
  },
  {
    name: "Chinelo Ipanema Wave",
    description: "Design ondulado inspirado nas praias cariocas.",
    base_price: 24.90,
    suggested_price: 34.00,
    sku: "IPA-WAVE-014",
    photo: "https://images.unsplash.com/photo-1594736797933-d0c8bb0e9802?w=400&h=400&fit=crop"
  },
  {
    name: "Chinelo Rider Strike",
    description: "Modelo esportivo com design moderno e colorido.",
    base_price: 36.90,
    suggested_price: 46.00,
    sku: "RID-STRIKE-015",
    photo: "https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=400&h=400&fit=crop"
  },
  {
    name: "Chinelo Havaianas Kids Disney",
    description: "Coleção infantil com personagens da Disney.",
    base_price: 22.90,
    suggested_price: 32.00,
    sku: "HAV-KIDS-016",
    photo: "https://images.unsplash.com/photo-1574708532532-37f6b985b7e8?w=400&h=400&fit=crop"
  },
  {
    name: "Chinelo Reef Fanning",
    description: "Com abridor de garrafa integrado na sola.",
    base_price: 89.90,
    suggested_price: 110.00,
    sku: "REEF-FANNING-017",
    photo: "https://images.unsplash.com/photo-1516478177764-9fe5bd7e9717?w=400&h=400&fit=crop"
  },
  {
    name: "Chinelo Quiksilver Molokai",
    description: "Design surf com estampa tropical.",
    base_price: 48.90,
    suggested_price: 65.00,
    sku: "QUIK-MOLOKAI-018",
    photo: "https://images.unsplash.com/photo-1506629905607-c9d320ac4e33?w=400&h=400&fit=crop"
  },
  {
    name: "Chinelo Billabong All Day",
    description: "Conforto para usar o dia todo.",
    base_price: 44.90,
    suggested_price: 58.00,
    sku: "BILL-ALLDAY-019",
    photo: "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=400&h=400&fit=crop"
  },
  {
    name: "Chinelo Osklen IPanema",
    description: "Colaboração exclusiva com design sustentável.",
    base_price: 78.90,
    suggested_price: 98.00,
    sku: "OSK-IPA-020",
    photo: "https://images.unsplash.com/photo-1552066344-2464c1135c32?w=400&h=400&fit=crop"
  },
  {
    name: "Chinelo Havaianas Metallic",
    description: "Acabamento metalizado para um visual sofisticado.",
    base_price: 39.90,
    suggested_price: 52.00,
    sku: "HAV-METALLIC-021",
    photo: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=400&h=400&fit=crop"
  },
  {
    name: "Chinelo Ipanema Fashion",
    description: "Modelo fashionista com aplicações decorativas.",
    base_price: 34.90,
    suggested_price: 45.00,
    sku: "IPA-FASHION-022",
    photo: "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=400&h=400&fit=crop"
  },
  {
    name: "Chinelo Rider Infinity",
    description: "Solado infinito para máximo conforto.",
    base_price: 41.90,
    suggested_price: 54.00,
    sku: "RID-INFINITY-023",
    photo: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&h=400&fit=crop"
  },
  {
    name: "Chinelo Kenner Kicks",
    description: "Estilo urbano com pegada esportiva.",
    base_price: 46.90,
    suggested_price: 59.00,
    sku: "KEN-KICKS-024",
    photo: "https://images.unsplash.com/photo-1580906853819-04bc41c0c10c?w=400&h=400&fit=crop"
  },
  {
    name: "Chinelo Cartago Memphis",
    description: "Design retrô inspirado nos anos 80.",
    base_price: 32.90,
    suggested_price: 43.00,
    sku: "CAR-MEMPHIS-025",
    photo: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop"
  },
  {
    name: "Chinelo Havaianas High Light",
    description: "Solado mais alto para maior elegância.",
    base_price: 45.90,
    suggested_price: 58.00,
    sku: "HAV-HIGHLIGHT-026",
    photo: "https://images.unsplash.com/photo-1594736797933-d0c8bb0e9802?w=400&h=400&fit=crop"
  },
  {
    name: "Chinelo Ipanema Mesh",
    description: "Tecnologia mesh para melhor ventilação.",
    base_price: 37.90,
    suggested_price: 49.00,
    sku: "IPA-MESH-027",
    photo: "https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=400&h=400&fit=crop"
  },
  {
    name: "Chinelo Rider R1",
    description: "Primeiro modelo da linha esportiva.",
    base_price: 39.90,
    suggested_price: 52.00,
    sku: "RID-R1-028",
    photo: "https://images.unsplash.com/photo-1524863479829-916d8e77f114?w=400&h=400&fit=crop"
  },
  {
    name: "Chinelo Lacoste Croco",
    description: "Elegância francesa com logo do crocodilo.",
    base_price: 159.90,
    suggested_price: 199.00,
    sku: "LAC-CROCO-029",
    photo: "https://images.unsplash.com/photo-1449247709967-d4461a6a6103?w=400&h=400&fit=crop"
  },
  {
    name: "Chinelo Tommy Hilfiger Flag",
    description: "Design clássico com bandeira americana.",
    base_price: 89.90,
    suggested_price: 115.00,
    sku: "TOMMY-FLAG-030",
    photo: "https://images.unsplash.com/photo-1520256862855-398228c41684?w=400&h=400&fit=crop"
  },
  {
    name: "Chinelo Havaianas Logomania",
    description: "Estampa all-over com logos da marca.",
    base_price: 34.90,
    suggested_price: 45.00,
    sku: "HAV-LOGOMANIA-031",
    photo: "https://images.unsplash.com/photo-1472887743288-0150ba830cab?w=400&h=400&fit=crop"
  },
  {
    name: "Chinelo Ipanema Zen",
    description: "Inspirado na filosofia zen para relaxamento total.",
    base_price: 29.90,
    suggested_price: 39.00,
    sku: "IPA-ZEN-032",
    photo: "https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=400&h=400&fit=crop"
  },
  {
    name: "Chinelo Rider Dunas",
    description: "Textura especial inspirada nas dunas do Nordeste.",
    base_price: 43.90,
    suggested_price: 56.00,
    sku: "RID-DUNAS-033",
    photo: "https://images.unsplash.com/photo-1603487742131-4160ec999306?w=400&h=400&fit=crop"
  },
  {
    name: "Chinelo Vans Slide-On",
    description: "Versão slide do clássico Vans Old Skool.",
    base_price: 79.90,
    suggested_price: 99.00,
    sku: "VANS-SLIDE-034",
    photo: "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=400&h=400&fit=crop"
  },
  {
    name: "Chinelo Converse All Star",
    description: "Iconico All Star em versão chinelo.",
    base_price: 69.90,
    suggested_price: 89.00,
    sku: "CONV-ALLSTAR-035",
    photo: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop"
  },
  {
    name: "Chinelo Havaianas Flores",
    description: "Estampa floral delicada para o verão.",
    base_price: 33.90,
    suggested_price: 44.00,
    sku: "HAV-FLORES-036",
    photo: "https://images.unsplash.com/photo-1594736797933-d0c8bb0e9802?w=400&h=400&fit=crop"
  },
  {
    name: "Chinelo Ipanema Boho",
    description: "Estilo boêmio com franjas e detalhes.",
    base_price: 41.90,
    suggested_price: 54.00,
    sku: "IPA-BOHO-037",
    photo: "https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=400&h=400&fit=crop"
  },
  {
    name: "Chinelo Rider Bay",
    description: "Inspirado nas baías tropicais.",
    base_price: 38.90,
    suggested_price: 49.00,
    sku: "RID-BAY-038",
    photo: "https://images.unsplash.com/photo-1574708532532-37f6b985b7e8?w=400&h=400&fit=crop"
  },
  {
    name: "Chinelo Fila Drifter",
    description: "Modelo retro-esportivo da Fila.",
    base_price: 67.90,
    suggested_price: 85.00,
    sku: "FILA-DRIFTER-039",
    photo: "https://images.unsplash.com/photo-1516478177764-9fe5bd7e9717?w=400&h=400&fit=crop"
  },
  {
    name: "Chinelo Puma Leadcat",
    description: "Design minimalista com logo Puma.",
    base_price: 74.90,
    suggested_price: 95.00,
    sku: "PUMA-LEADCAT-040",
    photo: "https://images.unsplash.com/photo-1506629905607-c9d320ac4e33?w=400&h=400&fit=crop"
  },
  {
    name: "Chinelo Havaianas Flash",
    description: "Modelo esportivo para atividades aquáticas.",
    base_price: 47.90,
    suggested_price: 62.00,
    sku: "HAV-FLASH-041",
    photo: "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=400&h=400&fit=crop"
  },
  {
    name: "Chinelo Ipanema Lolita",
    description: "Modelo feminino com aplicações de strass.",
    base_price: 36.90,
    suggested_price: 47.00,
    sku: "IPA-LOLITA-042",
    photo: "https://images.unsplash.com/photo-1552066344-2464c1135c32?w=400&h=400&fit=crop"
  },
  {
    name: "Chinelo Rider Montana",
    description: "Resistente para trilhas e aventuras.",
    base_price: 52.90,
    suggested_price: 68.00,
    sku: "RID-MONTANA-043",
    photo: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=400&h=400&fit=crop"
  },
  {
    name: "Chinelo Mizuno Wave",
    description: "Tecnologia Wave da Mizuno em chinelo.",
    base_price: 84.90,
    suggested_price: 109.00,
    sku: "MIZ-WAVE-044",
    photo: "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=400&h=400&fit=crop"
  },
  {
    name: "Chinelo Under Armour Ignite",
    description: "Tecnologia de amortecimento para performance.",
    base_price: 79.90,
    suggested_price: 102.00,
    sku: "UA-IGNITE-045",
    photo: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&h=400&fit=crop"
  },
  {
    name: "Chinelo Havaianas Kids Peppa",
    description: "Coleção infantil com personagem Peppa Pig.",
    base_price: 24.90,
    suggested_price: 34.00,
    sku: "HAV-PEPPA-046",
    photo: "https://images.unsplash.com/photo-1580906853819-04bc41c0c10c?w=400&h=400&fit=crop"
  },
  {
    name: "Chinelo Ipanema Philippe Starck",
    description: "Design assinado pelo famoso designer francês.",
    base_price: 67.90,
    suggested_price: 87.00,
    sku: "IPA-STARCK-047",
    photo: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop"
  },
  {
    name: "Chinelo Rider Free",
    description: "Liberdade total com design despojado.",
    base_price: 35.90,
    suggested_price: 46.00,
    sku: "RID-FREE-048",
    photo: "https://images.unsplash.com/photo-1594736797933-d0c8bb0e9802?w=400&h=400&fit=crop"
  },
  {
    name: "Chinelo Oakley Operative",
    description: "Estilo militar com durabilidade máxima.",
    base_price: 89.90,
    suggested_price: 115.00,
    sku: "OAK-OPERATIVE-049",
    photo: "https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=400&h=400&fit=crop"
  },
  {
    name: "Chinelo Havaianas Crystal",
    description: "Transparente com cristais aplicados.",
    base_price: 49.90,
    suggested_price: 65.00,
    sku: "HAV-CRYSTAL-050",
    photo: "https://images.unsplash.com/photo-1524863479829-916d8e77f114?w=400&h=400&fit=crop"
  }
];

const cores = [
  { id: 1, name: "Preto", hex_code: "#000000" },
  { id: 2, name: "Branco", hex_code: "#FFFFFF" },
  { id: 3, name: "Azul Marinho", hex_code: "#001f3f" },
  { id: 4, name: "Vermelho", hex_code: "#ff4136" },
  { id: 5, name: "Verde", hex_code: "#2ecc40" },
  { id: 6, name: "Amarelo", hex_code: "#ffdc00" },
  { id: 7, name: "Rosa", hex_code: "#ff69b4" },
  { id: 8, name: "Azul Claro", hex_code: "#7fdbff" },
  { id: 9, name: "Laranja", hex_code: "#ff851b" },
  { id: 10, name: "Roxo", hex_code: "#b10dc9" }
];

const tamanhos = [
  { id: 1, size: "33-34", display_order: 1 },
  { id: 2, size: "35-36", display_order: 2 },
  { id: 3, size: "37-38", display_order: 3 },
  { id: 4, size: "39-40", display_order: 4 },
  { id: 5, size: "41-42", display_order: 5 },
  { id: 6, size: "43-44", display_order: 6 },
  { id: 7, size: "45-46", display_order: 7 }
];

const grades = [
  {
    id: 1,
    name: "Grade Completa Familiar",
    description: "Kit familiar com todos os tamanhos - 12 pares",
    templates: [
      { size_id: 1, required_quantity: 1 },
      { size_id: 2, required_quantity: 2 },
      { size_id: 3, required_quantity: 3 },
      { size_id: 4, required_quantity: 3 },
      { size_id: 5, required_quantity: 2 },
      { size_id: 6, required_quantity: 1 }
    ]
  },
  {
    id: 2,
    name: "Grade Feminina",
    description: "Kit focado em tamanhos femininos - 8 pares",
    templates: [
      { size_id: 1, required_quantity: 1 },
      { size_id: 2, required_quantity: 3 },
      { size_id: 3, required_quantity: 3 },
      { size_id: 4, required_quantity: 1 }
    ]
  },
  {
    id: 3,
    name: "Grade Masculina",
    description: "Kit focado em tamanhos masculinos - 8 pares",
    templates: [
      { size_id: 3, required_quantity: 1 },
      { size_id: 4, required_quantity: 3 },
      { size_id: 5, required_quantity: 3 },
      { size_id: 6, required_quantity: 1 }
    ]
  },
  {
    id: 4,
    name: "Grade Infantil",
    description: "Kit infantil - 6 pares",
    templates: [
      { size_id: 1, required_quantity: 3 },
      { size_id: 2, required_quantity: 3 }
    ]
  }
];

export async function seedChinelos() {
  try {
    console.log("🏖️ Iniciando inserção de 50 produtos de chinelos...");

    // Get category for chinelos
    const [categories] = await db.execute("SELECT id FROM categories WHERE name LIKE '%chinelo%' OR name LIKE '%sandália%' LIMIT 1");
    let categoryId = 1; // Default category
    if ((categories as any[]).length > 0) {
      categoryId = (categories as any[])[0].id;
    }

    // Insert products
    for (let i = 0; i < chinelos.length; i++) {
      const produto = chinelos[i];
      
      console.log(`📦 Inserindo produto ${i + 1}/50: ${produto.name}`);

      // Insert product
      const [productResult] = await db.execute(
        `INSERT INTO products (name, description, category_id, base_price, suggested_price, sku, photo, active, sell_without_stock) 
         VALUES (?, ?, ?, ?, ?, ?, ?, true, false)`,
        [
          produto.name,
          produto.description,
          categoryId,
          produto.base_price,
          produto.suggested_price,
          produto.sku,
          produto.photo
        ]
      );

      const productId = (productResult as any).insertId;

      // Insert variants for each color and size combination
      for (const cor of cores) {
        for (const tamanho of tamanhos) {
          // Random stock between 0 and 20
          const stock = Math.floor(Math.random() * 21);
          
          // Some variants might have price overrides (20% chance)
          const priceOverride = Math.random() > 0.8 ? produto.base_price * (1 + (Math.random() * 0.3 - 0.15)) : null;

          await db.execute(
            `INSERT INTO product_variants (product_id, size_id, color_id, stock, price_override) 
             VALUES (?, ?, ?, ?, ?)`,
            [productId, tamanho.id, cor.id, stock, priceOverride]
          );
        }
      }

      // Associate product with random grades and colors
      const numGrades = Math.floor(Math.random() * 3) + 1; // 1-3 grades per product
      const numColors = Math.floor(Math.random() * 5) + 3; // 3-7 colors per product

      // Shuffle and select random grades
      const shuffledGrades = [...grades].sort(() => 0.5 - Math.random()).slice(0, numGrades);
      const shuffledColors = [...cores].sort(() => 0.5 - Math.random()).slice(0, numColors);

      for (const grade of shuffledGrades) {
        for (const cor of shuffledColors) {
          try {
            await db.execute(
              `INSERT INTO product_color_grades (product_id, color_id, grade_id) 
               VALUES (?, ?, ?)`,
              [productId, cor.id, grade.id]
            );
          } catch (error) {
            // Ignore duplicate entries
          }
        }
      }

      // Small delay to avoid overwhelming the database
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log("✅ Inserção de produtos concluída com sucesso!");
    console.log(`📊 Estatísticas:`);
    console.log(`   • ${chinelos.length} produtos inseridos`);
    console.log(`   • ${chinelos.length * cores.length * tamanhos.length} variantes criadas`);
    console.log(`   • Grades: Familiar, Feminina, Masculina, Infantil`);
    console.log(`   • Cores: ${cores.length} opções disponíveis`);
    console.log(`   • Tamanhos: ${tamanhos.length} opções disponíveis`);

    return true;
  } catch (error) {
    console.error("❌ Erro ao inserir produtos de chinelos:", error);
    throw error;
  }
}
