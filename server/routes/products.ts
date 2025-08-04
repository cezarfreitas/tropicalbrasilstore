import { Router } from "express";
import db from "../lib/db";
import { Product, CreateProductRequest } from "@shared/types";
import { validateApiKey } from "../lib/api-auth";
import { downloadAndSaveImage, isValidImageUrl } from "../lib/image-uploader";

interface BulkProductVariant {
  cor: string; // Cor da variante
  preco: number; // Preço da variante
  grade: string | string[]; // Grade/tamanho - aceita string única ou array de strings
  foto?: string; // URL da foto (opcional)
  sku?: string; // SKU específico (opcional)
  estoque_grade?: number | number[]; // Quantidade por grade - número único ou array posicional
  estoque_grades?: { [grade: string]: number }; // Estoque específico por grade individual
  estoque_tamanhos?: { [tamanho: string]: number }; // Estoque por tamanho individual
}

interface BulkProduct {
  codigo: string; // Código/SKU do produto
  nome: string; // Nome do produto
  categoria: string; // Categoria do produto
  tipo: string; // Tipo do produto
  marca?: string; // Marca do produto (opcional)
  genero?: string; // Gênero (opcional)
  descricao?: string; // Descrição do produto (opcional)
  preco_sugerido?: number; // Preço sugerido de venda (opcional)
  vender_infinito?: boolean; // Venda sem controle de estoque
  tipo_estoque?: "size" | "grade"; // Tipo de controle de estoque (opcional, default: 'grade')
  variantes: BulkProductVariant[]; // Lista de variantes
}

interface BulkProductsRequest {
  products: BulkProduct[];
}

const router = Router();

// Função auxiliar para criar ou buscar categoria
async function getOrCreateCategory(name: string): Promise<number> {
  // Buscar categoria existente
  const [existing] = await db.execute(
    "SELECT id FROM categories WHERE name = ?",
    [name],
  );

  if ((existing as any[]).length > 0) {
    return (existing as any[])[0].id;
  }

  // Criar nova categoria
  const [result] = await db.execute(
    "INSERT INTO categories (name, show_in_menu) VALUES (?, ?)",
    [name, true],
  );

  return (result as any).insertId;
}

// Função auxiliar para criar ou buscar tipo
async function getOrCreateType(name: string): Promise<number> {
  // Buscar tipo existente
  const [existing] = await db.execute("SELECT id FROM types WHERE name = ?", [
    name,
  ]);

  if ((existing as any[]).length > 0) {
    return (existing as any[])[0].id;
  }

  // Criar novo tipo
  const [result] = await db.execute(
    "INSERT INTO types (name, description) VALUES (?, ?)",
    [name, `Tipo ${name} criado automaticamente`],
  );

  return (result as any).insertId;
}

// Função auxiliar para criar ou buscar marca
async function getOrCreateBrand(name: string): Promise<number> {
  // Buscar marca existente
  const [existing] = await db.execute("SELECT id FROM brands WHERE name = ?", [
    name,
  ]);

  if ((existing as any[]).length > 0) {
    return (existing as any[])[0].id;
  }

  // Criar nova marca
  const [result] = await db.execute(
    "INSERT INTO brands (name, description) VALUES (?, ?)",
    [name, `Marca ${name} criada automaticamente`],
  );

  return (result as any).insertId;
}

// Função auxiliar para criar ou buscar cor
async function getOrCreateColor(name: string): Promise<number> {
  // Buscar cor existente
  const [existing] = await db.execute("SELECT id FROM colors WHERE name = ?", [
    name,
  ]);

  if ((existing as any[]).length > 0) {
    return (existing as any[])[0].id;
  }

  // Criar nova cor
  const [result] = await db.execute("INSERT INTO colors (name) VALUES (?)", [
    name,
  ]);

  return (result as any).insertId;
}

// Função auxiliar para criar ou buscar gênero
async function getOrCreateGender(name: string): Promise<number> {
  // Buscar gênero existente
  const [existing] = await db.execute("SELECT id FROM genders WHERE name = ?", [
    name,
  ]);

  if ((existing as any[]).length > 0) {
    return (existing as any[])[0].id;
  }

  // Criar novo gênero
  const [result] = await db.execute(
    "INSERT INTO genders (name, description) VALUES (?, ?)",
    [name, `Gênero ${name} criado automaticamente`],
  );

  return (result as any).insertId;
}

// Função auxiliar para criar ou buscar grade
async function getOrCreateGrade(name: string): Promise<number> {
  // Buscar grade existente
  const [existing] = await db.execute(
    "SELECT id FROM grade_vendida WHERE name = ?",
    [name],
  );

  if ((existing as any[]).length > 0) {
    return (existing as any[])[0].id;
  }

  // Criar nova grade com tamanhos automáticos baseados no nome
  const [result] = await db.execute(
    "INSERT INTO grade_vendida (name, description) VALUES (?, ?)",
    [name, `Grade ${name} criada automaticamente`],
  );

  const gradeId = (result as any).insertId;

  // Criar tamanhos automáticos baseados no tipo de grade
  let sizes: string[] = [];
  const lowerName = name.toLowerCase();

  if (lowerName.includes("feminina") || lowerName.includes("fem")) {
    sizes = ["34", "35", "36", "37", "38", "39", "40"];
  } else if (lowerName.includes("masculina") || lowerName.includes("masc")) {
    sizes = ["38", "39", "40", "41", "42", "43", "44"];
  } else if (lowerName.includes("infantil") || lowerName.includes("criança")) {
    sizes = [
      "20",
      "21",
      "22",
      "23",
      "24",
      "25",
      "26",
      "27",
      "28",
      "29",
      "30",
      "31",
      "32",
      "33",
    ];
  } else {
    // Grade unissex padrão
    sizes = ["35", "36", "37", "38", "39", "40", "41", "42"];
  }

  // Inserir os tamanhos da grade
  for (const size of sizes) {
    // Verificar se o tamanho já existe na tabela sizes
    const [existingSize] = await db.execute(
      "SELECT id FROM sizes WHERE size = ?",
      [size],
    );

    let sizeId;
    if ((existingSize as any[]).length > 0) {
      sizeId = (existingSize as any[])[0].id;
    } else {
      // Criar novo tamanho
      const [sizeResult] = await db.execute(
        "INSERT INTO sizes (size, display_order) VALUES (?, ?)",
        [size, sizes.indexOf(size) + 1],
      );
      sizeId = (sizeResult as any).insertId;
    }

    // Inserir na grade_templates
    await db.execute(
      "INSERT INTO grade_templates (grade_id, size_id, required_quantity) VALUES (?, ?, ?)",
      [gradeId, sizeId, 0],
    );
  }

  return gradeId;
}

// Create single product with variants (flexible format)
router.post("/create", validateApiKey, async (req, res) => {
  try {
    const productData = req.body;

    // Se foi enviado um array "products", processar como bulk
    if (productData.products && Array.isArray(productData.products)) {
      return res.status(400).json({
        success: false,
        error: "Use /bulk endpoint for multiple products",
        message: "This endpoint accepts single product only",
      });
    }

    // Validações básicas
    if (
      !productData.codigo ||
      !productData.nome ||
      !productData.categoria ||
      !productData.tipo ||
      !productData.variantes ||
      !Array.isArray(productData.variantes) ||
      productData.variantes.length === 0
    ) {
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        message:
          "Código, nome, categoria, tipo e pelo menos uma variante são obrigatórios",
      });
    }

    // Verificar se produto com código já existe
    const [existingProduct] = await db.execute(
      "SELECT id FROM products WHERE sku = ? OR parent_sku = ?",
      [productData.codigo, productData.codigo],
    );

    if ((existingProduct as any[]).length > 0) {
      return res.status(400).json({
        success: false,
        error: "Código já existe",
        message: `O produto com código '${productData.codigo}' já está cadastrado`,
        code: "DUPLICATE_CODE",
      });
    }

    // Processar o produto usando a mesma lógica do bulk
    const products = [productData];
    const createdProducts = [];
    const categoriesCreated = new Set<string>();
    const typesCreated = new Set<string>();
    const colorsCreated = new Set<string>();
    const gradesCreated = new Set<string>();
    let variantesCreadas = 0;

    // Usar a mesma lógica do bulk para processar o produto
    for (const product of products) {
      // Criar ou buscar entidades
      const categoryId = await getOrCreateCategory(product.categoria);
      const typeId = await getOrCreateType(product.tipo);

      // Criar ou buscar marca se fornecida
      let brandId = null;
      if (product.marca) {
        brandId = await getOrCreateBrand(product.marca);
      }

      categoriesCreated.add(product.categoria);
      typesCreated.add(product.tipo);

      // Criar ou buscar gênero se fornecido
      let genderId = null;
      if (product.genero) {
        genderId = await getOrCreateGender(product.genero);
      }

      // Criar produto principal
      const [productResult] = await db.execute(
        `INSERT INTO products
         (name, sku, parent_sku, description, category_id, type_id, brand_id, gender_id, suggested_price, active, sell_without_stock, stock_type)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          product.nome,
          product.codigo,
          product.codigo,
          product.descricao || "",
          categoryId,
          typeId,
          brandId,
          genderId,
          product.preco_sugerido || null,
          true,
          product.vender_infinito || false,
          product.tipo_estoque || "grade",
        ],
      );

      const productId = (productResult as any).insertId;

      // Processar variantes
      for (const variante of product.variantes) {
        if (
          !variante.cor ||
          !variante.preco ||
          variante.preco <= 0 ||
          !variante.grade
        ) {
          continue; // Pular variantes inválidas
        }

        // Criar ou buscar cor
        const colorId = await getOrCreateColor(variante.cor);
        colorsCreated.add(variante.cor);

        // Criar ou buscar grade
        const gradeId = await getOrCreateGrade(variante.grade);
        gradesCreated.add(variante.grade);

        // Processar foto se fornecida
        let imageUrl = variante.foto;
        if (imageUrl && isValidImageUrl(imageUrl)) {
          try {
            const savedImagePath = await downloadAndSaveImage(imageUrl);
            imageUrl = savedImagePath;
          } catch (error) {
            console.error(`Erro ao baixar imagem: ${error}`);
            // Continuar sem a imagem
            imageUrl = null;
          }
        }

        // Verificar se já existe uma variante para este produto e cor
        const [existingColorVariant] = await db.execute(
          "SELECT id FROM product_color_variants WHERE product_id = ? AND color_id = ?",
          [productId, colorId],
        );

        let colorVariantId;

        if ((existingColorVariant as any[]).length > 0) {
          // Atualizar variante existente
          colorVariantId = (existingColorVariant as any[])[0].id;
          await db.execute(
            `UPDATE product_color_variants
             SET variant_name = ?, price = ?, image_url = ?, stock_total = ?, active = ?
             WHERE id = ?`,
            [
              variante.cor,
              variante.preco,
              imageUrl,
              variante.estoque_grade || 0,
              true,
              colorVariantId,
            ],
          );
        } else {
          // Criar nova variante de cor
          // Verificar se a variante já existe antes de inserir
          const [existingVariant] = await db.execute(
            `SELECT id FROM product_color_variants WHERE product_id = ? AND color_id = ?`,
            [productId, colorId],
          );

          if ((existingVariant as any[]).length > 0) {
            // Variante já existe - atualizar
            colorVariantId = (existingVariant as any[])[0].id;
            await db.execute(
              `UPDATE product_color_variants SET variant_name = ?, price = ?, stock_total = ?, active = true WHERE id = ?`,
              [
                variante.cor,
                variante.preco,
                variante.estoque_grade || 0,
                colorVariantId,
              ],
            );
            console.log(
              `↻ Variante existente atualizada: ${variante.cor} (ID: ${colorVariantId})`,
            );
          } else {
            // Criar nova variante
            const [variantResult] = await db.execute(
              `INSERT INTO product_color_variants
               (product_id, color_id, variant_name, variant_sku, price, image_url, stock_total, active)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)
               ON DUPLICATE KEY UPDATE
               variant_name = VALUES(variant_name),
               variant_sku = VALUES(variant_sku),
               price = VALUES(price),
               image_url = VALUES(image_url),
               stock_total = VALUES(stock_total),
               active = VALUES(active)`,
              [
                productId,
                colorId,
                variante.cor,
                variante.sku || null,
                variante.preco,
                imageUrl,
                variante.estoque_grade || 0,
                true,
              ],
            );
            colorVariantId = (variantResult as any).insertId;
            console.log(
              `✅ Nova variante criada: ${variante.cor} (ID: ${colorVariantId})`,
            );
          }
        }

        // Associar grade ao produto-cor
        await db.execute(
          `INSERT IGNORE INTO product_color_grades (product_id, color_id, grade_id)
           VALUES (?, ?, ?)`,
          [productId, colorId, gradeId],
        );

        variantesCreadas++;
      }

      createdProducts.push({
        id: productId,
        codigo: product.codigo,
        nome: product.nome,
      });
    }

    res.json({
      success: true,
      message: "Produto criado com sucesso",
      data: {
        produtos_criados: createdProducts.length,
        variantes_criadas: variantesCreadas,
        categorias_criadas: Array.from(categoriesCreated),
        tipos_criados: Array.from(typesCreated),
        cores_criadas: Array.from(colorsCreated),
        grades_criadas: Array.from(gradesCreated),
        produtos: createdProducts,
      },
    });
  } catch (error) {
    console.error("Erro ao criar produto:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
      message: error instanceof Error ? error.message : "Erro desconhecido",
    });
  }
});

// Bulk create products with variants and grades
router.post("/bulk", async (req, res) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  console.log(
    `[${requestId}] Bulk API request started at ${new Date().toISOString()}`,
  );
  console.log(`[${requestId}] Request headers:`, {
    "content-type": req.headers["content-type"],
    "content-length": req.headers["content-length"],
    "user-agent": req.headers["user-agent"],
  });
  console.log(
    `[${requestId}] Request body size:`,
    JSON.stringify(req.body).length,
    "bytes",
  );

  try {
    // Support both old format {products: [...]} and new direct array format
    let products: any[];

    if (Array.isArray(req.body)) {
      // New direct array format
      console.log(`[${requestId}] Using new direct array format`);
      products = req.body;
    } else if (req.body.products && Array.isArray(req.body.products)) {
      // Old format with products wrapper
      console.log(`[${requestId}] Using legacy products wrapper format`);
      products = req.body.products;
    } else {
      console.error(`[${requestId}] Invalid request format`);
      return res.status(400).json({
        success: false,
        error: "Invalid request format",
        message: "Request body must be an array or contain a 'products' array",
        code: "INVALID_FORMAT",
        requestId,
      });
    }

    // Validação inicial
    if (!req.body) {
      console.error(`[${requestId}] No request body received`);
      return res.status(400).json({
        success: false,
        error: "Missing request body",
        message: "No data received in request body",
        code: "MISSING_BODY",
        requestId,
      });
    }

    if (!Array.isArray(products) || products.length === 0) {
      console.error(`[${requestId}] Invalid products array:`, typeof products);
      return res.status(400).json({
        success: false,
        error: "Invalid products format",
        message: "Products must be a non-empty array",
        code: "INVALID_PRODUCTS_FORMAT",
        requestId,
      });
    }

    if (products.length === 0) {
      console.error(`[${requestId}] Empty products array received`);
      return res.status(400).json({
        success: false,
        error: "Empty products array",
        message: "Products array cannot be empty",
        code: "EMPTY_PRODUCTS_ARRAY",
        requestId,
      });
    }

    console.log(`[${requestId}] Processing ${products.length} products`);

    const validationErrors: Array<{
      productIndex: number;
      product: any;
      errors: string[];
    }> = [];

    // Validar todos os produtos antes de processar
    products.forEach((product, index) => {
      const errors: string[] = [];

      if (!product.codigo) {
        errors.push("Missing codigo (SKU)");
      }
      if (!product.variantes || !Array.isArray(product.variantes)) {
        errors.push("Missing or invalid variantes array");
      }
      if (
        product.variantes &&
        Array.isArray(product.variantes) &&
        product.variantes.length === 0
      ) {
        errors.push("Variantes array cannot be empty");
      }

      if (errors.length > 0) {
        validationErrors.push({
          productIndex: index,
          product: { codigo: product.codigo, nome: product.nome },
          errors,
        });
      }
    });

    if (validationErrors.length > 0) {
      console.error(
        `[${requestId}] Validation errors found:`,
        validationErrors,
      );
      return res.status(422).json({
        success: false,
        error: "Validation errors",
        message: `${validationErrors.length} products have validation errors`,
        code: "VALIDATION_ERRORS",
        validationErrors,
        requestId,
      });
    }

    const createdProducts = [];
    const categoriesCreated = new Set<string>();
    const typesCreated = new Set<string>();
    const colorsCreated = new Set<string>();
    const gradesCreated = new Set<string>();
    let variantesCreadas = 0;

    // Processar cada produto
    for (const product of products) {
      // Valida��ões básicas
      if (
        !product.codigo ||
        !product.variantes ||
        product.variantes.length === 0
      ) {
        return res.status(422).json({
          success: false,
          error: "Dados inválidos",
          message: "Código e pelo menos uma variante são obrigatórios",
        });
      }

      // Verificar se produto com código já existe
      const [existingProduct] = await db.execute(
        "SELECT id, name, category_id, type_id, gender_id FROM products WHERE sku = ?",
        [product.codigo],
      );

      // Validação adicional para produtos novos
      if ((existingProduct as any[]).length === 0 && !product.nome) {
        return res.status(422).json({
          success: false,
          error: "Dados inválidos",
          message: "Nome é obrigatório para criar um novo produto",
        });
      }

      let productId;
      let isNewProduct = false;

      if ((existingProduct as any[]).length > 0) {
        // Produto já existe - usar o ID existente
        productId = (existingProduct as any[])[0].id;
        console.log(
          `📝 Produto existente encontrado: ${product.nome} (ID: ${productId})`,
        );

        // Verificar se as novas informações são diferentes e atualizar se necessário
        const existing = (existingProduct as any[])[0];

        // Criar ou buscar entidades apenas se fornecidas
        let categoryId = existing.category_id;
        let typeId = existing.type_id;
        let genderId = existing.gender_id;

        if (product.categoria) {
          categoryId = await getOrCreateCategory(product.categoria);
          categoriesCreated.add(product.categoria);
        }
        if (product.tipo) {
          typeId = await getOrCreateType(product.tipo);
          typesCreated.add(product.tipo);
        }
        if (product.genero) {
          genderId = await getOrCreateGender(product.genero);
        }

        // Atualizar informações do produto se fornecidas
        if (
          product.nome ||
          product.descricao ||
          product.categoria ||
          product.tipo ||
          product.genero ||
          product.preco_sugerido !== undefined
        ) {
          await db.execute(
            "UPDATE products SET name = COALESCE(?, name), description = COALESCE(?, description), category_id = ?, type_id = ?, gender_id = ?, suggested_price = COALESCE(?, suggested_price) WHERE id = ?",
            [
              product.nome || null,
              product.descricao || null,
              categoryId,
              typeId,
              genderId,
              product.preco_sugerido || null,
              productId,
            ],
          );
          console.log(`📝 Informa��ões do produto atualizadas`);
        }
      } else {
        // Produto não existe - criar novo
        isNewProduct = true;

        // Criar ou buscar categoria
        const categoryId = await getOrCreateCategory(product.categoria);
        categoriesCreated.add(product.categoria);

        // Criar ou buscar tipo
        const typeId = await getOrCreateType(product.tipo);
        typesCreated.add(product.tipo);

        // Criar ou buscar marca se fornecida
        let brandId = null;
        if (product.marca) {
          brandId = await getOrCreateBrand(product.marca);
        }

        // Criar ou buscar gênero se fornecido
        let genderId = null;
        if (product.genero) {
          genderId = await getOrCreateGender(product.genero);
        }

        // Calcular preço base a partir da primeira variante
        const basePrice = product.variantes[0].preco;

        // Criar produto principal
        const [productResult] = await db.execute(
          "INSERT INTO products (name, description, category_id, type_id, brand_id, gender_id, sku, base_price, suggested_price, sell_without_stock, stock_type, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            product.nome,
            product.descricao || null,
            categoryId,
            typeId,
            brandId,
            genderId,
            product.codigo,
            basePrice,
            product.preco_sugerido || null,
            product.vender_infinito || false,
            product.tipo_estoque || "grade",
            true,
          ],
        );

        productId = (productResult as any).insertId;
        console.log(`✅ Produto criado: ${product.nome} (ID: ${productId})`);
      }
      const variants = [];

      // Processar cada variante
      for (const variante of product.variantes) {
        console.log(
          `🎨 Processando variante: ${variante.cor} do produto: ${product.codigo}`,
        );

        if (!variante.cor || variante.preco <= 0 || !variante.grade) {
          console.error(`❌ Dados inválidos para variante ${variante.cor}:`, {
            cor: variante.cor,
            preco: variante.preco,
            grade: variante.grade,
          });
          return res.status(422).json({
            success: false,
            error: "Dados inválidos",
            message:
              "Cor, preço > 0 e grade são obrigatórios para cada variante",
            produto: product.codigo,
            variante: variante.cor,
          });
        }

        // Criar ou buscar cor
        console.log(
          `🎨 Criando/buscando cor: ${variante.cor} para produto ${product.codigo}`,
        );
        const colorId = await getOrCreateColor(variante.cor);
        colorsCreated.add(variante.cor);
        console.log(
          `✅ Cor criada/encontrada: ${variante.cor} (ID: ${colorId})`,
        );

        // Processar grades - suporta string única, array ou string separada por vírgula
        let gradesToProcess: string[] = [];
        if (Array.isArray(variante.grade)) {
          gradesToProcess = variante.grade;
        } else if (typeof variante.grade === "string") {
          // Se contém vírgula, dividir em múltiplas grades
          gradesToProcess = variante.grade.includes(",")
            ? variante.grade
                .split(",")
                .map((g) => g.trim())
                .filter((g) => g.length > 0)
            : [variante.grade];
        }

        console.log(
          `📊 Grades a processar para ${variante.cor}:`,
          gradesToProcess,
        );

        if (gradesToProcess.length === 0) {
          console.error(
            `❌ Nenhuma grade válida encontrada para ${product.codigo} - ${variante.cor}`,
          );
          console.error(`📋 Grade original: "${variante.grade}"`);
          return res.status(422).json({
            success: false,
            error: "Grade inválida",
            message: "Pelo menos uma grade deve ser fornecida",
            produto: product.codigo,
            variante: variante.cor,
            grade_original: variante.grade,
          });
        }

        // Download e salvar imagem UMA VEZ antes do loop das grades
        let imageUrlForDatabase = null;
        if (variante.foto) {
          console.log(`🔍 Verificando URL da imagem: ${variante.foto}`);
          const isValid = isValidImageUrl(variante.foto);
          console.log(`📋 URL é válida: ${isValid}`);

          if (isValid) {
            const localImagePath = await downloadAndSaveImage(
              variante.foto,
              product.codigo,
              variante.cor,
            );

            // Construir URL completa para salvar no banco
            if (localImagePath) {
              const baseUrl =
                process.env.APP_URL ||
                "https://b2b.tropicalbrasilsandalias.com.br";
              imageUrlForDatabase = `${baseUrl}${localImagePath}`;
              console.log(
                `📷 Imagem processada para ${variante.cor}: ${imageUrlForDatabase}`,
              );
            }
          } else {
            console.log(`❌ URL de imagem inválida: ${variante.foto}`);
          }
        }

        // PRIMEIRO: Criar/encontrar a variante de cor (uma por produto+cor)
        console.log(
          `🔍 Verificando variante de cor existente para produto ${productId}, cor ${colorId}`,
        );
        const [existingColorVariant] = await db.execute(
          `SELECT id FROM product_color_variants WHERE product_id = ? AND color_id = ?`,
          [productId, colorId],
        );
        console.log(`📋 Resultado da busca:`, existingColorVariant);

        let colorVariantId;
        const variantSku =
          variante.sku ||
          `${product.codigo}-${variante.cor.toUpperCase().replace(/\s+/g, "-")}`;

        if ((existingColorVariant as any[]).length > 0) {
          // Variante já existe - atualizar
          colorVariantId = (existingColorVariant as any[])[0].id;
          console.log(
            `  ↻ Variante de cor existente encontrada: ${variante.cor} (ID: ${colorVariantId})`,
          );

          try {
            await db.execute(
              `UPDATE product_color_variants SET price = ?, variant_name = ?, variant_sku = ?, image_url = ?, active = true WHERE id = ?`,
              [
                variante.preco,
                `${product.nome} - ${variante.cor}`,
                variantSku,
                imageUrlForDatabase,
                colorVariantId,
              ],
            );
            console.log(`✅ Variante de cor atualizada com sucesso`);
          } catch (updateError) {
            console.error(`❌ Erro ao atualizar variante de cor:`, updateError);
            throw updateError;
          }
        } else {
          // Criar nova variante
          try {
            console.log(
              `🆕 Criando nova variante de cor para ${product.nome} - ${variante.cor}`,
            );
            const [colorVariantResult] = await db.execute(
              `INSERT INTO product_color_variants
             (product_id, color_id, variant_name, variant_sku, price, image_url, stock_total, active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                productId,
                colorId,
                `${product.nome} - ${variante.cor}`,
                variantSku,
                variante.preco,
                imageUrlForDatabase,
                0,
                true,
              ],
            );
            colorVariantId = (colorVariantResult as any).insertId;
            console.log(
              `✅ Nova variante de cor criada: ${variante.cor} (ID: ${colorVariantId})`,
            );
          } catch (insertError) {
            console.error(`❌ Erro ao criar variante de cor:`, insertError);
            console.error(`📋 Dados que falharam:`, {
              productId,
              colorId,
              nome: product.nome,
              cor: variante.cor,
              variantSku,
              preco: variante.preco,
              imageUrl: imageUrlForDatabase,
            });
            throw insertError;
          }
        }

        // SEGUNDO: Associar cada grade �� variante de cor criada acima
        for (const gradeNome of gradesToProcess) {
          console.log(`🔄 Processando grade: ${gradeNome}`);
          const gradeId = await getOrCreateGrade(gradeNome);
          console.log(
            `�� Grade criada/encontrada: ${gradeNome} (ID: ${gradeId})`,
          );
          gradesCreated.add(gradeNome);

          // A variante de cor já foi criada/encontrada acima, vamos apenas associar a grade

          // Gerar SKU para variante se não fornecido
          const gradeVariantSku =
            variante.sku ||
            `${product.codigo}-${variante.cor.toUpperCase().replace(/\s+/g, "-")}-${gradeNome}`;

          if (variante.foto) {
            console.log(`��� Verificando URL da imagem: ${variante.foto}`);
            const isValid = isValidImageUrl(variante.foto);
            console.log(`📋 URL é válida: ${isValid}`);

            if (isValid) {
              // Esta imagem já foi baixada antes do loop das grades
              console.log(
                "⚠️ Pulando download duplicado - imagem já processada",
              );
              console.log(`  📷 Imagem já processada para ${variante.cor}`);
            } else {
              console.log(`  ❌ URL de imagem inválida: ${variante.foto}`);
            }
          }

          // Verificar se a relação produto-cor-grade já existe
          const [existingRelation] = await db.execute(
            `SELECT id FROM product_color_grades
           WHERE product_id = ? AND color_id = ? AND grade_id = ?`,
            [productId, colorId, gradeId],
          );

          let variantResult;
          if ((existingRelation as any[]).length === 0) {
            // Inserir relação produto-cor-grade apenas se não existir
            [variantResult] = await db.execute(
              `INSERT INTO product_color_grades
             (product_id, color_id, grade_id)
             VALUES (?, ?, ?)`,
              [productId, colorId, gradeId],
            );
            console.log(`  ✅ Nova relação produto-cor-grade criada`);
          } else {
            console.log(
              `  ⚠️ Relação produto-cor-grade já existe, reutilizando`,
            );
            variantResult = { insertId: (existingRelation as any[])[0].id };
          }

          // A variante de cor (colorVariantId) já foi criada acima, usar ela

          console.log(
            `  ✅ Variante de cor criada: ${variante.cor} - ${gradeNome}`,
          );

          // Buscar todos os tamanhos da grade para criar variantes para cada um
          const [gradeTemplates] = await db.execute(
            "SELECT gt.id, gt.size_id, s.size FROM grade_templates gt JOIN sizes s ON gt.size_id = s.id WHERE gt.grade_id = ? ORDER BY s.display_order",
            [gradeId],
          );

          if ((gradeTemplates as any[]).length > 0) {
            // Criar uma variante física para cada tamanho da grade
            for (const template of gradeTemplates as any[]) {
              const sizeId = template.size_id;
              const sizeName = template.size;

              // SKU espec��fico para cada tamanho
              const sizeVariantSku = `${gradeVariantSku}-${sizeName}`;

              // Verificar se a variante já existe
              const [existingVariant] = await db.execute(
                `SELECT id FROM product_variants
               WHERE product_id = ? AND color_id = ? AND size_id = ?`,
                [productId, colorId, sizeId],
              );

              if ((existingVariant as any[]).length === 0) {
                // Criar variante física do produto apenas se não existir
                await db.execute(
                  `INSERT INTO product_variants
                 (product_id, color_id, size_id, price_override, image_url, created_at)
                 VALUES (?, ?, ?, ?, ?, NOW())`,
                  [
                    productId,
                    colorId,
                    sizeId,
                    variante.preco,
                    imageUrlForDatabase,
                  ],
                );
              } else {
                console.log(
                  `  ⚠️ Variante ${sizeName} já existe para ${variante.cor}, atualizando preço`,
                );
                // Atualizar preço se necessário
                await db.execute(
                  `UPDATE product_variants
                 SET price_override = ?, image_url = COALESCE(?, image_url)
                 WHERE product_id = ? AND color_id = ? AND size_id = ?`,
                  [
                    variante.preco,
                    imageUrlForDatabase,
                    productId,
                    colorId,
                    sizeId,
                  ],
                );
              }
            }

            console.log(
              `  ✅ ${(gradeTemplates as any[]).length} variantes criadas para ${variante.cor} - SKU: ${gradeVariantSku}`,
            );
          } else {
            console.log(
              `  ⚠️ Não foi possível criar variante física para ${variante.cor} - grade sem tamanhos`,
            );
          }

          // Processar estoque baseado no tipo
          if (product.tipo_estoque === "grade") {
            let estoqueParaEstaGrade = 0;

            // Determinar índice da grade atual na lista de grades
            const gradeIndex = gradesToProcess.indexOf(gradeNome);

            // Prioridade: estoque_grades específico > estoque_grade array posicional > estoque_grade geral
            if (
              variante.estoque_grades &&
              variante.estoque_grades[gradeNome] !== undefined
            ) {
              estoqueParaEstaGrade = variante.estoque_grades[gradeNome];
              console.log(
                `  📦 Usando estoque específico para grade ${gradeNome}: ${estoqueParaEstaGrade}`,
              );
            } else if (
              Array.isArray(variante.estoque_grade) &&
              gradeIndex >= 0 &&
              gradeIndex < variante.estoque_grade.length
            ) {
              estoqueParaEstaGrade = variante.estoque_grade[gradeIndex];
              console.log(
                `  📦 Usando estoque posicional [${gradeIndex}] para grade ${gradeNome}: ${estoqueParaEstaGrade}`,
              );
            } else if (typeof variante.estoque_grade === "number") {
              estoqueParaEstaGrade = variante.estoque_grade;
              console.log(
                `  📦 Usando estoque geral para grade ${gradeNome}: ${estoqueParaEstaGrade}`,
              );
            }

            if (estoqueParaEstaGrade > 0) {
              // Estoque por grade - definir quantidade na relação produto-cor-grade
              await db.execute(
                `UPDATE product_color_grades
               SET stock_quantity = ?
               WHERE product_id = ? AND color_id = ? AND grade_id = ?`,
                [estoqueParaEstaGrade, productId, colorId, gradeId],
              );
              console.log(
                `  ✅ Estoque configurado para grade ${gradeNome}: ${estoqueParaEstaGrade} unidades`,
              );
            }
          } else if (
            product.tipo_estoque === "size" &&
            variante.estoque_tamanhos
          ) {
            // Estoque por tamanho - definir quantidade individual por tamanho
            for (const [tamanho, quantidade] of Object.entries(
              variante.estoque_tamanhos,
            )) {
              // Buscar size_id pelo nome do tamanho
              const [sizeResult] = await db.execute(
                `SELECT id FROM sizes WHERE size = ?`,
                [tamanho],
              );

              if ((sizeResult as any[]).length > 0) {
                const sizeId = (sizeResult as any[])[0].id;
                await db.execute(
                  `UPDATE product_variants
                 SET stock = ?
                 WHERE product_id = ? AND color_id = ? AND size_id = ?`,
                  [quantidade, productId, colorId, sizeId],
                );
                console.log(
                  `  📦 Estoque tamanho ${tamanho}: ${quantidade} unidades`,
                );
              }
            }
          }

          // Salvar foto do produto se fornecida (na primeira variante)
          if (imageUrlForDatabase && variants.length === 0) {
            await db.execute("UPDATE products SET photo = ? WHERE id = ?", [
              imageUrlForDatabase,
              productId,
            ]);
          }

          variants.push({
            id: colorVariantId,
            cor: variante.cor,
            sku: variantSku,
            grade: gradeNome,
            preco: variante.preco,
            status: "created",
          });

          variantesCreadas++;
        } // fim do loop de grades
      } // fim do loop de variantes

      console.log(
        `�� Total de variantes processadas para ${product.codigo}: ${variants.length}`,
      );

      createdProducts.push({
        id: productId,
        codigo: product.codigo,
        nome: product.nome,
        status: isNewProduct ? "created" : "updated",
        variantes: variants,
      });
    }

    // Calcular estatísticas detalhadas
    const variantesNovas = createdProducts
      .flatMap((p) => p.variantes)
      .filter((v) => v.status === "created").length;
    const variantesExistentes = createdProducts
      .flatMap((p) => p.variantes)
      .filter((v) => v.status === "existing").length;
    const produtosNovos = createdProducts.filter(
      (p) => p.status === "created",
    ).length;
    const produtosAtualizados = createdProducts.filter(
      (p) => p.status === "updated",
    ).length;

    // Resposta de sucesso com logging detalhado
    const processingTime = Date.now() - startTime;
    console.log(
      `[${requestId}] Bulk processing completed successfully in ${processingTime}ms`,
      {
        productsProcessed: products.length,
        newProducts: produtosNovos,
        updatedProducts: produtosAtualizados,
        newVariants: variantesNovas,
        processingTime: `${processingTime}ms`,
      },
    );

    res.status(201).json({
      success: true,
      message: "Processamento concluído com sucesso",
      requestId,
      processingTime: `${processingTime}ms`,
      data: {
        produtos_processados: products.length,
        produtos_novos: produtosNovos,
        produtos_atualizados: produtosAtualizados,
        variantes_novas: variantesNovas,
        variantes_existentes: variantesExistentes,
        total_variantes: variantesNovas + variantesExistentes,
        categorias_criadas: Array.from(categoriesCreated),
        tipos_criados: Array.from(typesCreated),
        cores_criadas: Array.from(colorsCreated),
        grades_criadas: Array.from(gradesCreated),
        produtos: createdProducts,
      },
    });
  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error(
      `[${requestId}] Critical error in bulk product creation after ${processingTime}ms:`,
      {
        errorMessage: error.message,
        errorStack: error.stack,
        errorCode: error.code,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage,
        processingTime: `${processingTime}ms`,
      },
    );

    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "Failed to process products due to server error",
      code: "INTERNAL_SERVER_ERROR",
      details: {
        requestId,
        processingTime: `${processingTime}ms`,
        timestamp: new Date().toISOString(),
        errorType: error.constructor.name,
        // Incluir detalhes do erro SQL se disponível
        ...(error.code && { sqlErrorCode: error.code }),
        ...(error.sqlState && { sqlState: error.sqlState }),
        ...(process.env.NODE_ENV === "development" && {
          errorMessage: error.message,
          stack: error.stack,
        }),
      },
      requestId,
    });
  }
});

// Single product create with one variant
router.post("/single", validateApiKey, async (req, res) => {
  try {
    const {
      codigo,
      nome,
      categoria,
      tipo,
      marca,
      genero,
      descricao,
      cor,
      preco,
      preco_sugerido,
      grade,
      foto,
      vender_infinito,
    } = req.body;

    // Validações básicas
    if (!codigo || !nome || !cor || !preco || preco <= 0 || !grade) {
      return res.status(422).json({
        success: false,
        error: "Dados inválidos",
        message: "Código, nome, cor, preço > 0 e grade são obrigatórios",
      });
    }

    // Verificar se produto com c��digo já existe
    const [existingProduct] = await db.execute(
      "SELECT id FROM products WHERE sku = ?",
      [codigo],
    );

    if ((existingProduct as any[]).length > 0) {
      return res.status(400).json({
        success: false,
        error: "Código já existe",
        message: `O produto com código '${codigo}' já está cadastrado`,
        code: "DUPLICATE_CODE",
      });
    }

    // Criar ou buscar entidades
    const categoryId = await getOrCreateCategory(categoria);
    const typeId = await getOrCreateType(tipo);
    const colorId = await getOrCreateColor(cor);
    const gradeId = await getOrCreateGrade(grade);

    // Criar ou buscar marca se fornecida
    let brandId = null;
    if (marca) {
      brandId = await getOrCreateBrand(marca);
    }

    // Criar ou buscar gênero se fornecido
    let genderId = null;
    if (genero) {
      genderId = await getOrCreateGender(genero);
    }

    // Criar produto
    const [productResult] = await db.execute(
      "INSERT INTO products (name, description, category_id, type_id, brand_id, gender_id, sku, base_price, suggested_price, sell_without_stock, stock_type, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        nome,
        descricao || null,
        categoryId,
        typeId,
        brandId,
        genderId,
        codigo,
        preco,
        preco_sugerido || null,
        vender_infinito || false,
        "grade", // default para grade
        true,
      ],
    );

    const productId = (productResult as any).insertId;

    // Verificar se a relação produto-cor-grade já existe
    const [existingRelation] = await db.execute(
      "SELECT id FROM product_color_grades WHERE product_id = ? AND color_id = ? AND grade_id = ?",
      [productId, colorId, gradeId],
    );

    if ((existingRelation as any[]).length === 0) {
      // Criar relação produto-cor-grade apenas se não existir
      await db.execute(
        "INSERT INTO product_color_grades (product_id, color_id, grade_id) VALUES (?, ?, ?)",
        [productId, colorId, gradeId],
      );
    }

    const variantSku = `${codigo}-${cor.toUpperCase().replace(/\s+/g, "-")}`;

    // Download e salvar imagem se fornecida
    let imageUrlForDatabase = null;
    if (foto && isValidImageUrl(foto)) {
      const localImagePath = await downloadAndSaveImage(foto, codigo, cor);

      // Construir URL completa para salvar no banco
      if (localImagePath) {
        const baseUrl =
          process.env.APP_URL || "https://b2b.tropicalbrasilsandalias.com.br";
        imageUrlForDatabase = `${baseUrl}${localImagePath}`;
        console.log(`📷 Imagem processada para ${cor}: ${imageUrlForDatabase}`);
      }
    }

    // Criar entrada na tabela product_color_variants para compatibilidade com admin WooCommerce
    await db.execute(
      `INSERT INTO product_color_variants
       (product_id, color_id, variant_name, variant_sku, price, image_url, stock_total, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       variant_name = VALUES(variant_name),
       variant_sku = VALUES(variant_sku),
       price = VALUES(price),
       image_url = VALUES(image_url),
       active = VALUES(active)`,
      [
        productId,
        colorId,
        `${nome} - ${cor}`,
        variantSku,
        preco,
        imageUrlForDatabase,
        0, // stock_total inicial
        true,
      ],
    );

    // Buscar o primeiro tamanho da grade para criar a variante padrão
    const [gradeTemplates] = await db.execute(
      "SELECT gt.id, gt.size_id FROM grade_templates gt JOIN sizes s ON gt.size_id = s.id WHERE gt.grade_id = ? ORDER BY s.display_order LIMIT 1",
      [gradeId],
    );

    if ((gradeTemplates as any[]).length > 0) {
      const sizeId = (gradeTemplates as any[])[0].size_id;

      // Verificar se a variante já existe
      const [existingVariant] = await db.execute(
        "SELECT id FROM product_variants WHERE product_id = ? AND color_id = ? AND size_id = ?",
        [productId, colorId, sizeId],
      );

      if ((existingVariant as any[]).length === 0) {
        // Criar variante física do produto apenas se não existir
        await db.execute(
          "INSERT INTO product_variants (product_id, color_id, size_id, price_override, created_at) VALUES (?, ?, ?, ?, NOW())",
          [productId, colorId, sizeId, preco],
        );
      } else {
        console.log(`⚠️ Variante já existe, atualizando preço`);
        // Atualizar preço se necess��rio
        await db.execute(
          "UPDATE product_variants SET price_override = ? WHERE product_id = ? AND color_id = ? AND size_id = ?",
          [preco, productId, colorId, sizeId],
        );
      }

      console.log(`✅ Produto e variante criados: ${nome} - ${cor}`);
    } else {
      console.log(
        `⚠️ Produto criado mas sem variante física - grade sem tamanhos`,
      );
    }

    // Resposta de sucesso
    res.status(201).json({
      success: true,
      message: "Produto cadastrado com sucesso",
      data: {
        id: productId,
        codigo,
        nome,
        categoria,
        tipo,
        genero,
        cor,
        grade,
        preco,
        vender_infinito: vender_infinito || false,
        variant_sku: variantSku,
      },
    });
  } catch (error: any) {
    console.error("Error creating single product:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
      message: "Não foi possível criar o produto",
    });
  }
});

// Get all products with category information
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      ORDER BY p.name
    `);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// Get product variants by codigo
router.get("/:codigo/variants", async (req, res) => {
  try {
    const { codigo } = req.params;

    const [rows] = await db.execute(
      `
      SELECT
        pv.id,
        c.name as cor,
        s.size as tamanho,
        pv.price_override as preco,
        pv.image_url as foto,
        pv.stock as estoque,
        g.id as grade_id,
        g.name as grade_nome
      FROM products p
      JOIN product_variants pv ON p.id = pv.product_id
      JOIN colors c ON pv.color_id = c.id
      JOIN sizes s ON pv.size_id = s.id
      LEFT JOIN product_color_grades pcg ON (p.id = pcg.product_id AND pv.color_id = pcg.color_id)
      LEFT JOIN grade_vendida g ON pcg.grade_id = g.id
      WHERE p.sku = ? AND p.active = true
      ORDER BY c.name, s.display_order
    `,
      [codigo],
    );

    if ((rows as any[]).length === 0) {
      return res.status(404).json({
        success: false,
        error: "Produto não encontrado",
        message: `Nenhum produto encontrado com código '${codigo}'`,
      });
    }

    res.json(rows);
  } catch (error) {
    console.error("Error fetching product variants:", error);
    res.status(500).json({ error: "Failed to fetch product variants" });
  }
});

// Get product by ID
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT p.*, c.name as category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.id = ?`,
      [req.params.id],
    );
    const products = rows as any[];
    if (products.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(products[0]);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// Create new product
router.post("/", async (req, res) => {
  try {
    const {
      name,
      description,
      category_id,
      base_price,
      sku,
    }: CreateProductRequest = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    const [result] = await db.execute(
      "INSERT INTO products (name, description, category_id, base_price, sku) VALUES (?, ?, ?, ?, ?)",
      [
        name,
        description || null,
        category_id || null,
        base_price || null,
        sku || null,
      ],
    );

    const insertResult = result as any;
    const [rows] = await db.execute(
      `SELECT p.*, c.name as category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.id = ?`,
      [insertResult.insertId],
    );
    const products = rows as any[];

    res.status(201).json(products[0]);
  } catch (error: any) {
    console.error("Error creating product:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "SKU already exists" });
    }
    res.status(500).json({ error: "Failed to create product" });
  }
});

// Update product
router.put("/:id", async (req, res) => {
  try {
    const {
      name,
      description,
      category_id,
      base_price,
      sku,
      active,
    }: CreateProductRequest & { active?: boolean } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    await db.execute(
      "UPDATE products SET name = ?, description = ?, category_id = ?, base_price = ?, sku = ?, active = ? WHERE id = ?",
      [
        name,
        description || null,
        category_id || null,
        base_price || null,
        sku || null,
        active !== undefined ? active : true,
        req.params.id,
      ],
    );

    const [rows] = await db.execute(
      `SELECT p.*, c.name as category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.id = ?`,
      [req.params.id],
    );
    const products = rows as any[];

    if (products.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(products[0]);
  } catch (error: any) {
    console.error("Error updating product:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "SKU already exists" });
    }
    res.status(500).json({ error: "Failed to update product" });
  }
});

// Delete product
router.delete("/:id", async (req, res) => {
  try {
    const [result] = await db.execute("DELETE FROM products WHERE id = ?", [
      req.params.id,
    ]);
    const deleteResult = result as any;

    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

export { router as productsRouter };
