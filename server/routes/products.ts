import { Router } from "express";
import db from "../lib/db";
import { Product, CreateProductRequest } from "@shared/types";
import { validateApiKey } from "../lib/api-auth";
import { downloadAndSaveImage, isValidImageUrl } from "../lib/image-uploader";

interface BulkProductVariant {
  cor: string; // Cor da variante
  preco: number; // Preço da variante
  grade: string; // Grade/tamanho
  foto?: string; // URL da foto (opcional)
  sku?: string; // SKU específico (opcional)
}

interface BulkProduct {
  codigo: string; // Código/SKU do produto
  nome: string; // Nome do produto
  categoria: string; // Categoria do produto
  tipo: string; // Tipo do produto
  genero?: string; // Gênero (opcional)
  descricao?: string; // Descrição do produto (opcional)
  preco_sugerido?: number; // Preço sugerido de venda (opcional)
  vender_infinito?: boolean; // Venda sem controle de estoque
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

// Bulk create products with variants and grades
router.post("/bulk", validateApiKey, async (req, res) => {
  try {
    const { products }: BulkProductsRequest = req.body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Products array is required",
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
      // Validações básicas
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
          console.log(`📝 Informações do produto atualizadas`);
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

        // Criar ou buscar gênero se fornecido
        let genderId = null;
        if (product.genero) {
          genderId = await getOrCreateGender(product.genero);
        }

        // Calcular preço base a partir da primeira variante
        const basePrice = product.variantes[0].preco;

        // Criar produto principal
        const [productResult] = await db.execute(
          "INSERT INTO products (name, description, category_id, type_id, gender_id, sku, base_price, suggested_price, sell_without_stock, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            product.nome,
            product.descricao || null,
            categoryId,
            typeId,
            genderId,
            product.codigo,
            basePrice,
            product.preco_sugerido || null,
            product.vender_infinito || false,
            true,
          ],
        );

        productId = (productResult as any).insertId;
        console.log(`✅ Produto criado: ${product.nome} (ID: ${productId})`);
      }
      const variants = [];

      // Processar cada variante
      for (const variante of product.variantes) {
        if (!variante.cor || variante.preco <= 0 || !variante.grade) {
          return res.status(422).json({
            success: false,
            error: "Dados inválidos",
            message:
              "Cor, preço > 0 e grade são obrigatórios para cada variante",
          });
        }

        // Criar ou buscar cor
        const colorId = await getOrCreateColor(variante.cor);
        colorsCreated.add(variante.cor);

        // Verificar se já existe uma variante desta cor para este produto
        const [existingColorVariant] = await db.execute(
          "SELECT id FROM product_color_variants WHERE product_id = ? AND color_id = ?",
          [productId, colorId],
        );

        if ((existingColorVariant as any[]).length > 0) {
          console.log(
            `⚠️ Variante de cor ${variante.cor} já existe para o produto ${product.codigo} - pulando...`,
          );

          // Adicionar à lista de variantes retornadas (mesmo que não criada)
          variants.push({
            id: (existingColorVariant as any[])[0].id,
            cor: variante.cor,
            sku:
              variante.sku ||
              `${product.codigo}-${variante.cor.toUpperCase().replace(/\s+/g, "-")}`,
            grade: variante.grade,
            preco: variante.preco,
            status: "existing",
          });
          continue;
        }

        // Criar ou buscar grade
        const gradeId = await getOrCreateGrade(variante.grade);
        gradesCreated.add(variante.grade);

        // Gerar SKU para variante se não fornecido
        const variantSku =
          variante.sku ||
          `${product.codigo}-${variante.cor.toUpperCase().replace(/\s+/g, "-")}`;

        // Download e salvar imagem se fornecida
        let localImageUrl = null;
        if (variante.foto && isValidImageUrl(variante.foto)) {
          localImageUrl = await downloadAndSaveImage(
            variante.foto,
            product.codigo,
            variante.cor,
          );
          console.log(
            `  📷 Imagem processada para ${variante.cor}: ${localImageUrl || "falhou"}`,
          );
        }

        // Inserir relação produto-cor-grade
        const [variantResult] = await db.execute(
          `INSERT INTO product_color_grades
           (product_id, color_id, grade_id)
           VALUES (?, ?, ?)`,
          [productId, colorId, gradeId],
        );

        // Criar entrada na tabela product_color_variants para compatibilidade com admin WooCommerce
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
            localImageUrl,
            0, // stock_total inicial
            true,
          ],
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

            // SKU específico para cada tamanho
            const sizeVariantSku = `${variantSku}-${sizeName}`;

            // Criar variante física do produto (product_variants)
            await db.execute(
              `INSERT INTO product_variants
               (product_id, color_id, size_id, price_override, image_url, created_at)
               VALUES (?, ?, ?, ?, ?, NOW())`,
              [productId, colorId, sizeId, variante.preco, localImageUrl],
            );
          }

          console.log(
            `  ✅ ${(gradeTemplates as any[]).length} variantes criadas para ${variante.cor} - SKU: ${variantSku}`,
          );
        } else {
          console.log(
            `  ⚠️ Não foi possível criar variante física para ${variante.cor} - grade sem tamanhos`,
          );
        }

        // Salvar foto do produto se fornecida (na primeira variante)
        if (localImageUrl && variants.length === 0) {
          await db.execute("UPDATE products SET photo = ? WHERE id = ?", [
            localImageUrl,
            productId,
          ]);
        }

        variants.push({
          id: (variantResult as any).insertId,
          cor: variante.cor,
          sku: variantSku,
          grade: variante.grade,
          preco: variante.preco,
          status: "created",
        });

        variantesCreadas++;
      }

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

    // Resposta de sucesso
    res.status(201).json({
      success: true,
      message: "Processamento concluído com sucesso",
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
    console.error("Error in bulk product creation:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
      message: "Não foi possível processar os produtos",
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

    // Verificar se produto com código já existe
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

    // Criar ou buscar gênero se fornecido
    let genderId = null;
    if (genero) {
      genderId = await getOrCreateGender(genero);
    }

    // Criar produto
    const [productResult] = await db.execute(
      "INSERT INTO products (name, description, category_id, type_id, gender_id, sku, base_price, suggested_price, sell_without_stock, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        nome,
        descricao || null,
        categoryId,
        typeId,
        genderId,
        codigo,
        preco,
        preco_sugerido || null,
        vender_infinito || false,
        true,
      ],
    );

    const productId = (productResult as any).insertId;

    // Criar relação produto-cor-grade
    await db.execute(
      "INSERT INTO product_color_grades (product_id, color_id, grade_id) VALUES (?, ?, ?)",
      [productId, colorId, gradeId],
    );

    const variantSku = `${codigo}-${cor.toUpperCase().replace(/\s+/g, "-")}`;

    // Download e salvar imagem se fornecida
    let localImageUrl = null;
    if (foto && isValidImageUrl(foto)) {
      localImageUrl = await downloadAndSaveImage(foto, codigo, cor);
      console.log(
        `📷 Imagem processada para ${cor}: ${localImageUrl || "falhou"}`,
      );
    }

    // Criar entrada na tabela product_color_variants para compatibilidade com admin WooCommerce
    await db.execute(
      `INSERT INTO product_color_variants
       (product_id, color_id, variant_name, variant_sku, price, image_url, stock_total, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        productId,
        colorId,
        `${nome} - ${cor}`,
        variantSku,
        preco,
        localImageUrl,
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

      // Criar variante física do produto
      await db.execute(
        "INSERT INTO product_variants (product_id, color_id, size_id, price_override, created_at) VALUES (?, ?, ?, ?, NOW())",
        [productId, colorId, sizeId, preco],
      );

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
