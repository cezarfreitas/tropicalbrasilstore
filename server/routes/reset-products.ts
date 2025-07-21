import { Router } from "express";
import { resetAndSeedProducts } from "../lib/reset-and-seed-products";

const router = Router();

router.post("/run", async (req, res) => {
  try {
    console.log("🚀 Starting product database reset and seeding...");
    
    const result = await resetAndSeedProducts();
    
    res.json({
      success: true,
      message: "Banco de dados de produtos limpo e repovoado com sucesso!",
      data: result
    });
  } catch (error) {
    console.error("❌ Error resetting and seeding products:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao limpar e repovoar banco de dados de produtos",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

router.get("/status", (req, res) => {
  res.json({
    message: "Product reset endpoint ready",
    description: "Este endpoint limpa todos os produtos existentes e adiciona novos produtos com cores, tamanhos e estoque",
    endpoint: "POST /api/reset-products/run"
  });
});

export { router as resetProductsRouter };
