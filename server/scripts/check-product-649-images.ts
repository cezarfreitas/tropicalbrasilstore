import db from "../lib/db";

async function checkProduct649() {
  try {
    console.log("🔍 Verificando produto 649...");

    // Check product 649 in products table
    const [product] = await db.execute(
      "SELECT id, name, photo, active FROM products WHERE id = 649",
    );

    if ((product as any[]).length === 0) {
      console.log("❌ Produto 649 não encontrado na tabela products");
      return;
    }

    const productData = (product as any[])[0];
    console.log("📦 Produto 649:", {
      id: productData.id,
      name: productData.name,
      photo: productData.photo,
      active: productData.active,
    });

    // Check color variants for product 649
    const [variants] = await db.execute(`
      SELECT 
        pcv.id, 
        pcv.variant_name, 
        pcv.image_url, 
        pcv.active,
        c.name as color_name
      FROM product_color_variants pcv
      LEFT JOIN colors c ON pcv.color_id = c.id
      WHERE pcv.product_id = 649
    `);

    console.log(`🎨 Variantes de cor (${(variants as any[]).length}):`);
    (variants as any[]).forEach((variant, index) => {
      console.log(
        `  ${index + 1}. ${variant.variant_name} (${variant.color_name})`,
      );
      console.log(`     ID: ${variant.id}`);
      console.log(`     Image URL: ${variant.image_url || "null"}`);
      console.log(`     Active: ${variant.active}`);
      console.log("");
    });

    // Check color grades for product 649
    const [colorGrades] = await db.execute(`
      SELECT 
        pcg.product_id,
        pcg.color_id,
        pcg.grade_id,
        c.name as color_name,
        g.name as grade_name
      FROM product_color_grades pcg
      LEFT JOIN colors c ON pcg.color_id = c.id
      LEFT JOIN grade_vendida g ON pcg.grade_id = g.id
      WHERE pcg.product_id = 649
    `);

    console.log(
      `📊 Relações produto-cor-grade (${(colorGrades as any[]).length}):`,
    );
    (colorGrades as any[]).forEach((relation, index) => {
      console.log(
        `  ${index + 1}. Cor: ${relation.color_name}, Grade: ${relation.grade_name}`,
      );
    });

    // Check if product appears in store API
    console.log("\n🔍 Verificando se aparece na API da loja...");

    // Simulate the store query
    const [storeProducts] = await db.execute(`
      SELECT
        p.id,
        p.name,
        p.description,
        p.base_price,
        p.active,
        p.photo,
        c.name as category_name,
        COUNT(DISTINCT pv.id) as variant_count,
        COALESCE(SUM(pv.stock), 0) as total_stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      WHERE p.active = true AND p.id = 649
      GROUP BY p.id
    `);

    if ((storeProducts as any[]).length > 0) {
      console.log("✅ Produto 649 aparece na consulta da loja");
      const storeData = (storeProducts as any[])[0];
      console.log("📋 Dados da loja:", {
        id: storeData.id,
        name: storeData.name,
        photo: storeData.photo,
        category: storeData.category_name,
        variants: storeData.variant_count,
        stock: storeData.total_stock,
      });
    } else {
      console.log("❌ Produto 649 NÃO aparece na consulta da loja");
    }

    // Test image URL validity
    if (productData.photo) {
      console.log(`\n🔗 Testando URL da imagem: ${productData.photo}`);
      try {
        const https = require("https");
        const http = require("http");
        const url = require("url");

        const parsedUrl = url.parse(productData.photo);
        const protocol = parsedUrl.protocol === "https:" ? https : http;

        const req = protocol.request(parsedUrl, (res: any) => {
          console.log(`📡 Status HTTP: ${res.statusCode}`);
          console.log(`📄 Content-Type: ${res.headers["content-type"]}`);
          if (
            res.statusCode === 200 &&
            res.headers["content-type"]?.startsWith("image/")
          ) {
            console.log("✅ Imagem acessível e válida");
          } else {
            console.log("❌ Imagem não acessível ou não é uma imagem válida");
          }
        });

        req.on("error", (error: any) => {
          console.log(`❌ Erro ao acessar imagem: ${error.message}`);
        });

        req.setTimeout(5000, () => {
          console.log("⏰ Timeout ao acessar imagem");
          req.destroy();
        });

        req.end();
      } catch (error) {
        console.log(`❌ Erro ao testar URL: ${(error as Error).message}`);
      }
    }
  } catch (error) {
    console.error("❌ Erro ao verificar produto 649:", error);
  }
}

checkProduct649();
