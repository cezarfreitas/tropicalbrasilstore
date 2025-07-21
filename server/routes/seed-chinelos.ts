import { Router } from "express";
import { seedChinelos } from "../lib/seed-chinelos";

const router = Router();

router.post("/", async (req, res) => {
  try {
    console.log("🚀 Iniciando seed de chinelos...");
    
    await seedChinelos();
    
    res.json({
      success: true,
      message: "50 produtos de chinelos inseridos com sucesso!",
      details: {
        produtos: 50,
        variantes: 50 * 10 * 7, // 50 produtos × 10 cores × 7 tamanhos
        grades: 4,
        cores: 10,
        tamanhos: 7
      }
    });
  } catch (error) {
    console.error("Erro no seed de chinelos:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao inserir produtos de chinelos",
      error: error.message
    });
  }
});

export { router as seedChinelosRouter };
