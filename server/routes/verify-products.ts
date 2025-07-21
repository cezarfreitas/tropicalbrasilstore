import { Router } from "express";
import db from "../lib/db";

const router = Router();

router.get("/summary", async (req, res) => {
  try {
    // Get product counts
    const [productCount] = await db.execute("SELECT COUNT(*) as count FROM products WHERE active = true");
    const [variantCount] = await db.execute("SELECT COUNT(*) as count FROM product_variants");
    const [colorCount] = await db.execute("SELECT COUNT(*) as count FROM colors");
    const [sizeCount] = await db.execute("SELECT COUNT(*) as count FROM sizes");

    // Get sample products with basic info
    const [sampleProducts] = await db.execute(`
      SELECT 
        p.id,
        p.name,
        p.sku,
        p.base_price,
        COUNT(pv.id) as variant_count
      FROM products p
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      WHERE p.active = true
      GROUP BY p.id, p.name, p.sku, p.base_price
      ORDER BY p.name
      LIMIT 5
    `);

    // Get simple stock statistics
    const [zeroStock] = await db.execute("SELECT COUNT(*) as count FROM product_variants WHERE stock = 0");
    const [lowStock] = await db.execute("SELECT COUNT(*) as count FROM product_variants WHERE stock BETWEEN 1 AND 10");
    const [mediumStock] = await db.execute("SELECT COUNT(*) as count FROM product_variants WHERE stock BETWEEN 11 AND 30");
    const [highStock] = await db.execute("SELECT COUNT(*) as count FROM product_variants WHERE stock > 30");

    const stockDistribution = [
      { stock_level: "Sem estoque", variant_count: (zeroStock as any)[0].count },
      { stock_level: "Estoque baixo (1-10)", variant_count: (lowStock as any)[0].count },
      { stock_level: "Estoque médio (11-30)", variant_count: (mediumStock as any)[0].count },
      { stock_level: "Estoque alto (30+)", variant_count: (highStock as any)[0].count }
    ];

    res.json({
      summary: {
        total_products: (productCount as any)[0].count,
        total_variants: (variantCount as any)[0].count,
        total_colors: (colorCount as any)[0].count,
        total_sizes: (sizeCount as any)[0].count,
        avg_variants_per_product: Math.round((variantCount as any)[0].count / (productCount as any)[0].count)
      },
      sample_products: sampleProducts,
      stock_distribution: stockDistribution
    });
  } catch (error) {
    console.error("❌ Error getting product verification data:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar dados de verificação dos produtos",
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

router.get("/products/:id/variants", async (req, res) => {
  try {
    const productId = req.params.id;
    
    const [variants] = await db.execute(`
      SELECT 
        pv.id,
        pv.stock,
        c.name as color_name,
        c.hex_code,
        s.size,
        s.display_order
      FROM product_variants pv
      JOIN colors c ON pv.color_id = c.id
      JOIN sizes s ON pv.size_id = s.id
      WHERE pv.product_id = ?
      ORDER BY s.display_order, c.name
    `, [productId]);

    res.json({
      product_id: productId,
      variants: variants
    });
  } catch (error) {
    console.error("❌ Error getting product variants:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar variantes do produto",
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

export { router as verifyProductsRouter };
