import { Router } from "express";
import db from "../lib/db";

const router = Router();

// Atualizar tipo de estoque do produto
router.put("/products/:id/stock-type", async (req, res) => {
  try {
    const { stock_type } = req.body;
    const productId = req.params.id;

    if (!['size', 'grade'].includes(stock_type)) {
      return res.status(400).json({ error: "Tipo de estoque inválido" });
    }

    await db.execute(
      `UPDATE products SET stock_type = ? WHERE id = ?`,
      [stock_type, productId]
    );

    res.json({ success: true, message: "Tipo de estoque atualizado" });
  } catch (error) {
    console.error("Erro ao atualizar tipo de estoque:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Obter estoque por grade
router.get("/products/:id/grade-stock", async (req, res) => {
  try {
    const productId = req.params.id;

    const [gradeStocks] = await db.execute(`
      SELECT 
        pcg.grade_id,
        pcg.color_id,
        pcg.stock_quantity,
        g.name as grade_name,
        c.name as color_name,
        c.hex_code
      FROM product_color_grades pcg
      INNER JOIN grade_vendida g ON pcg.grade_id = g.id
      INNER JOIN colors c ON pcg.color_id = c.id
      WHERE pcg.product_id = ? AND g.active = 1
      ORDER BY g.name, c.name
    `, [productId]);

    res.json(gradeStocks);
  } catch (error) {
    console.error("Erro ao obter estoque por grade:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Atualizar estoque por grade
router.put("/products/:id/grade-stock", async (req, res) => {
  try {
    const { grade_id, color_id, stock_quantity } = req.body;
    const productId = req.params.id;

    await db.execute(`
      UPDATE product_color_grades 
      SET stock_quantity = ? 
      WHERE product_id = ? AND grade_id = ? AND color_id = ?
    `, [stock_quantity, productId, grade_id, color_id]);

    res.json({ success: true, message: "Estoque da grade atualizado" });
  } catch (error) {
    console.error("Erro ao atualizar estoque da grade:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Obter estoque por tamanho
router.get("/products/:id/size-stock", async (req, res) => {
  try {
    const productId = req.params.id;

    const [sizeStocks] = await db.execute(`
      SELECT 
        pv.id as variant_id,
        pv.stock,
        s.size,
        c.name as color_name,
        c.hex_code
      FROM product_variants pv
      INNER JOIN sizes s ON pv.size_id = s.id
      INNER JOIN colors c ON pv.color_id = c.id
      WHERE pv.product_id = ?
      ORDER BY s.display_order, c.name
    `, [productId]);

    res.json(sizeStocks);
  } catch (error) {
    console.error("Erro ao obter estoque por tamanho:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Atualizar estoque por tamanho
router.put("/products/:id/size-stock", async (req, res) => {
  try {
    const { variant_id, stock } = req.body;

    await db.execute(`
      UPDATE product_variants 
      SET stock = ? 
      WHERE id = ?
    `, [stock, variant_id]);

    res.json({ success: true, message: "Estoque do tamanho atualizado" });
  } catch (error) {
    console.error("Erro ao atualizar estoque do tamanho:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Criar nova combinação grade/cor
router.post("/products/:id/grade-stock", async (req, res) => {
  try {
    const { grade_id, color_id, stock_quantity } = req.body;
    const productId = req.params.id;

    // Verificar se a combinação já existe
    const [existing] = await db.execute(`
      SELECT id FROM product_color_grades 
      WHERE product_id = ? AND grade_id = ? AND color_id = ?
    `, [productId, grade_id, color_id]);

    if ((existing as any[]).length > 0) {
      // Se existe, atualizar
      await db.execute(`
        UPDATE product_color_grades 
        SET stock_quantity = ? 
        WHERE product_id = ? AND grade_id = ? AND color_id = ?
      `, [stock_quantity, productId, grade_id, color_id]);
    } else {
      // Se não existe, criar
      await db.execute(`
        INSERT INTO product_color_grades (product_id, grade_id, color_id, stock_quantity)
        VALUES (?, ?, ?, ?)
      `, [productId, grade_id, color_id, stock_quantity]);
    }

    res.json({ success: true, message: "Estoque da grade configurado" });
  } catch (error) {
    console.error("Erro ao criar estoque da grade:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Obter resumo de estoque do produto
router.get("/products/:id/stock-summary", async (req, res) => {
  try {
    const productId = req.params.id;

    // Obter informações básicas do produto
    const [productInfo] = await db.execute(`
      SELECT id, name, stock_type, sell_without_stock
      FROM products 
      WHERE id = ?
    `, [productId]);

    if ((productInfo as any[]).length === 0) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }

    const product = (productInfo as any[])[0];
    let stockSummary = { product };

    if (product.stock_type === 'grade') {
      // Resumo para estoque por grade
      const [gradeStats] = await db.execute(`
        SELECT 
          COUNT(*) as total_combinations,
          SUM(stock_quantity) as total_stock,
          COUNT(CASE WHEN stock_quantity > 0 THEN 1 END) as available_combinations
        FROM product_color_grades pcg
        INNER JOIN grade_vendida g ON pcg.grade_id = g.id
        WHERE pcg.product_id = ? AND g.active = 1
      `, [productId]);

      stockSummary.grade_stats = (gradeStats as any[])[0];
    } else {
      // Resumo para estoque por tamanho
      const [sizeStats] = await db.execute(`
        SELECT 
          COUNT(*) as total_variants,
          SUM(stock) as total_stock,
          COUNT(CASE WHEN stock > 0 THEN 1 END) as available_variants
        FROM product_variants 
        WHERE product_id = ?
      `, [productId]);

      stockSummary.size_stats = (sizeStats as any[])[0];
    }

    res.json(stockSummary);
  } catch (error) {
    console.error("Erro ao obter resumo de estoque:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export { router as stockManagementRouter };
