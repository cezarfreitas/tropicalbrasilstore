import { Router } from "express";
import db from "../lib/db";

const router = Router();

// Delete all products except one
router.post("/keep-one", async (req, res) => {
  try {
    console.log("🧹 Starting cleanup - keeping only one product...");
    
    // Get the first product ID to keep
    const [firstProduct] = await db.execute(`
      SELECT id, name FROM products 
      ORDER BY id ASC 
      LIMIT 1
    `);
    
    if (!firstProduct || (firstProduct as any[]).length === 0) {
      return res.json({
        success: true,
        message: "Nenhum produto encontrado para manter",
        kept: null,
        deleted: 0
      });
    }
    
    const productToKeep = (firstProduct as any[])[0];
    console.log(`📌 Keeping product: ${productToKeep.name} (ID: ${productToKeep.id})`);
    
    // Count products to be deleted
    const [countResult] = await db.execute(`
      SELECT COUNT(*) as total FROM products WHERE id != ?
    `, [productToKeep.id]);
    
    const totalToDelete = (countResult as any[])[0].total;
    
    if (totalToDelete === 0) {
      return res.json({
        success: true,
        message: "Apenas um produto encontrado, nada para deletar",
        kept: productToKeep,
        deleted: 0
      });
    }
    
    console.log(`🗑️ Deleting ${totalToDelete} products...`);
    
    // Start transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();
    
    try {
      // Delete order items for products that will be deleted
      await connection.execute(`
        DELETE FROM order_items 
        WHERE product_id != ?
      `, [productToKeep.id]);
      
      // Delete product variants for products that will be deleted
      await connection.execute(`
        DELETE FROM product_variants 
        WHERE product_id != ?
      `, [productToKeep.id]);
      
      // Delete product color grades for products that will be deleted
      await connection.execute(`
        DELETE FROM product_color_grades 
        WHERE product_id != ?
      `, [productToKeep.id]);
      
      // Delete products except the one to keep
      const [deleteResult] = await connection.execute(`
        DELETE FROM products 
        WHERE id != ?
      `, [productToKeep.id]);
      
      await connection.commit();
      
      const deletedCount = (deleteResult as any).affectedRows;
      
      console.log(`✅ Successfully deleted ${deletedCount} products`);
      console.log(`📌 Kept product: ${productToKeep.name}`);
      
      res.json({
        success: true,
        message: `Mantido apenas 1 produto, deletados ${deletedCount} produtos`,
        kept: productToKeep,
        deleted: deletedCount
      });
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao fazer limpeza dos produtos",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// Get cleanup status
router.get("/status", async (req, res) => {
  try {
    const [countResult] = await db.execute(`
      SELECT COUNT(*) as total FROM products
    `);
    
    const [firstProduct] = await db.execute(`
      SELECT id, name FROM products 
      ORDER BY id ASC 
      LIMIT 1
    `);
    
    const totalProducts = (countResult as any[])[0].total;
    const firstProductData = (firstProduct as any[])[0] || null;
    
    res.json({
      totalProducts,
      firstProduct: firstProductData,
      message: "Status da limpeza de produtos",
      endpoint: "POST /api/cleanup-products/keep-one"
    });
  } catch (error) {
    res.status(500).json({
      error: "Erro ao obter status",
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

export { router as cleanupProductsRouter };
