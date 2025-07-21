import db from "./db";

export async function enhanceDatabase() {
  // Placeholder function for compatibility
  console.log("Database enhancement function called");
  return true;
}

export async function addEnhancedMockupData() {
  try {
    console.log("Adding enhanced mockup data...");

    // First, let's add more products that work with current schema
    const moreProducts = [
      {
        name: "Havaianas Top Mix",
        description: "Chinelo tradicional brasileiro com estampa única",
        category_id: 1, // Chinelos Masculinos
        base_price: 28.9,
        sku: "HAV004",
      },
      {
        name: "Ipanema Class Pop",
        description: "Sandália feminina moderna e colorida",
        category_id: 2, // Chinelos Femininos
        base_price: 35.9,
        sku: "IPA002",
      },
      {
        name: "Rider Strike Plus",
        description: "Chinelo masculino esportivo com maior durabilidade",
        category_id: 1,
        base_price: 42.9,
        sku: "RID002",
      },
      {
        name: "Melissa Beach Slide Fashion",
        description: "Sandália premium com design exclusivo",
        category_id: 2,
        base_price: 95.9,
        sku: "MEL002",
      },
      {
        name: "Havaianas Kids Minions",
        description: "Chinelo infantil com personagens dos Minions",
        category_id: 3, // Chinelos Infantis
        base_price: 24.9,
        sku: "HAV005",
      },
      {
        name: "Nike Benassi JDI",
        description: "Sandália esportiva premium da Nike",
        category_id: 4, // Sandálias Esportivas
        base_price: 159.9,
        sku: "NIK001",
      },
      {
        name: "Kenner Acqua Pro",
        description: "Chinelo de borracha profissional",
        category_id: 5, // Chinelos de Borracha
        base_price: 33.9,
        sku: "KEN002",
      },
      {
        name: "Grendene Zaxy Garden",
        description: "Sandália feminina com estampa floral",
        category_id: 2,
        base_price: 48.9,
        sku: "ZAX002",
      },
      {
        name: "Havaianas You Metallic",
        description: "Chinelo feminino com acabamento metalizado",
        category_id: 2,
        base_price: 39.9,
        sku: "HAV006",
      },
      {
        name: "Rider Dunas Evolution",
        description: "Chinelo masculino anatomico premium",
        category_id: 1,
        base_price: 55.9,
        sku: "RID003",
      },
      {
        name: "Ipanema Gisele Bundchen",
        description: "Sandália assinada pela Gisele Bundchen",
        category_id: 2,
        base_price: 67.9,
        sku: "IPA003",
      },
      {
        name: "Reef Fanning",
        description: "Chinelo com abridor de garrafa embutido",
        category_id: 4,
        base_price: 189.9,
        sku: "REE001",
      },
      {
        name: "Havaianas Baby",
        description: "Chinelo especial para bebês",
        category_id: 3,
        base_price: 21.9,
        sku: "HAV007",
      },
      {
        name: "Quiksilver Molokai",
        description: "Chinelo surf style masculino",
        category_id: 1,
        base_price: 79.9,
        sku: "QUI001",
      },
      {
        name: "Roxy Sandy",
        description: "Sandália feminina estilo praia",
        category_id: 2,
        base_price: 89.9,
        sku: "ROX001",
      },
      {
        name: "Kenner Rhaco Onda",
        description: "Chinelo de borracha com design ondulado",
        category_id: 5,
        base_price: 29.9,
        sku: "KEN003",
      },
      {
        name: "Melissa Possession",
        description: "Sandália alta fashion feminina",
        category_id: 2,
        base_price: 129.9,
        sku: "MEL003",
      },
      {
        name: "Havaianas Urban Craft",
        description: "Chinelo masculino urbano com solado diferenciado",
        category_id: 1,
        base_price: 49.9,
        sku: "HAV008",
      },
      {
        name: "Ipanema Nectar",
        description: "Sandália perfumada com essência floral",
        category_id: 2,
        base_price: 41.9,
        sku: "IPA004",
      },
      {
        name: "Rider Infinity",
        description: "Chinelo anatomico com tecnologia de amortecimento",
        category_id: 1,
        base_price: 62.9,
        sku: "RID004",
      },
    ];

    // Add new products
    for (const product of moreProducts) {
      await db.execute(
        "INSERT INTO products (name, description, category_id, base_price, sku) VALUES (?, ?, ?, ?, ?)",
        [
          product.name,
          product.description,
          product.category_id,
          product.base_price,
          product.sku,
        ],
      );
    }

    // Add some more colors if needed
    const additionalColors = [
      { name: "Dourado", hex_code: "#FFD700" },
      { name: "Prateado", hex_code: "#C0C0C0" },
      { name: "Laranja", hex_code: "#FF8C00" },
      { name: "Roxo", hex_code: "#8A2BE2" },
      { name: "Turquesa", hex_code: "#40E0D0" },
      { name: "Coral", hex_code: "#FF7F50" },
      { name: "Lime", hex_code: "#32CD32" },
      { name: "Magenta", hex_code: "#FF00FF" },
    ];

    for (const color of additionalColors) {
      try {
        await db.execute("INSERT INTO colors (name, hex_code) VALUES (?, ?)", [
          color.name,
          color.hex_code,
        ]);
      } catch (error) {
        // Ignore if color already exists
        console.log(`Color ${color.name} already exists, skipping...`);
      }
    }

    // Add some more customers for testing
    const sampleCustomers = [
      {
        name: "Maria Silva Santos",
        email: "maria.silva@email.com",
        whatsapp: "+55 11 99999-1111",
      },
      {
        name: "João Pedro Oliveira",
        email: "joao.pedro@email.com",
        whatsapp: "+55 11 99999-2222",
      },
      {
        name: "Ana Carolina Lima",
        email: "ana.carolina@email.com",
        whatsapp: "+55 11 99999-3333",
      },
      {
        name: "Carlos Eduardo Souza",
        email: "carlos.eduardo@email.com",
        whatsapp: "+55 11 99999-4444",
      },
      {
        name: "Fernanda Costa Alves",
        email: "fernanda.costa@email.com",
        whatsapp: "+55 11 99999-5555",
      },
      {
        name: "Ricardo Mendes Silva",
        email: "ricardo.mendes@email.com",
        whatsapp: "+55 11 99999-6666",
      },
      {
        name: "Juliana Rodrigues",
        email: "juliana.rodrigues@email.com",
        whatsapp: "+55 11 99999-7777",
      },
      {
        name: "Bruno Ferreira Lima",
        email: "bruno.ferreira@email.com",
        whatsapp: "+55 11 99999-8888",
      },
    ];

    for (const customer of sampleCustomers) {
      try {
        await db.execute(
          "INSERT INTO customers (name, email, whatsapp) VALUES (?, ?, ?)",
          [customer.name, customer.email, customer.whatsapp],
        );
      } catch (error) {
        // Ignore if customer already exists
        console.log(`Customer ${customer.email} already exists, skipping...`);
      }
    }

    // Create some sample orders
    const sampleOrders = [
      {
        customer_email: "maria.silva@email.com",
        total_amount: 89.8,
        status: "delivered",
        notes: "Entrega realizada com sucesso",
      },
      {
        customer_email: "joao.pedro@email.com",
        total_amount: 159.9,
        status: "shipped",
        notes: "Produto em transporte",
      },
      {
        customer_email: "ana.carolina@email.com",
        total_amount: 67.9,
        status: "processing",
        notes: "Pedido em preparação",
      },
      {
        customer_email: "carlos.eduardo@email.com",
        total_amount: 129.8,
        status: "confirmed",
        notes: "Pagamento confirmado",
      },
      {
        customer_email: "fernanda.costa@email.com",
        total_amount: 49.9,
        status: "pending",
        notes: "Aguardando confirmação de pagamento",
      },
    ];

    for (const order of sampleOrders) {
      const [orderResult] = await db.execute(
        "INSERT INTO orders (customer_email, total_amount, status, notes) VALUES (?, ?, ?, ?)",
        [order.customer_email, order.total_amount, order.status, order.notes],
      );

      const orderId = (orderResult as any).insertId;

      // Add some order items
      const itemsForOrder = Math.floor(Math.random() * 3) + 1; // 1-3 items per order
      for (let i = 0; i < itemsForOrder; i++) {
        const productId = Math.floor(Math.random() * 20) + 1; // Random product
        const sizeId = Math.floor(Math.random() * 13) + 1; // Random size
        const colorId = Math.floor(Math.random() * 10) + 1; // Random color
        const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 quantity
        const unitPrice = Math.floor(Math.random() * 100) + 20; // R$ 20-120
        const totalPrice = unitPrice * quantity;

        await db.execute(
          "INSERT INTO order_items (order_id, product_id, size_id, color_id, quantity, unit_price, total_price, type) VALUES (?, ?, ?, ?, ?, ?, ?, 'individual')",
          [
            orderId,
            productId,
            sizeId,
            colorId,
            quantity,
            unitPrice,
            totalPrice,
          ],
        );
      }
    }

    console.log("✅ Enhanced mockup data added successfully!");
    console.log("Added:");
    console.log(`- ${moreProducts.length} additional products`);
    console.log(`- ${additionalColors.length} new colors`);
    console.log(`- ${sampleCustomers.length} sample customers`);
    console.log(`- ${sampleOrders.length} sample orders with items`);

    return true;
  } catch (error) {
    console.error("❌ Error adding enhanced mockup data:", error);
    throw error;
  }
}
