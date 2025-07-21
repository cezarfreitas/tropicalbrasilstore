import { Router } from "express";
import { addEnhancedMockupData } from "../lib/enhanced-seed";

const router = Router();

router.post("/add", async (req, res) => {
  try {
    console.log("Adding enhanced mockup data...");
    const success = await addEnhancedMockupData();
    
    if (success) {
      res.json({
        success: true,
        message: "Dados de mockup adicionados com sucesso!",
        details: {
          products: "20 produtos adicionais",
          colors: "8 cores novas",
          customers: "8 clientes de exemplo",
          orders: "5 pedidos com itens"
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Erro ao adicionar dados de mockup",
      });
    }
  } catch (error) {
    console.error("Error adding mockup data:", error);
    res.status(500).json({
      success: false,
      error: "Falha ao adicionar dados de mockup",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

router.get("/status", (req, res) => {
  res.json({
    message: "Endpoint de dados mockup está pronto",
    endpoint: "POST /api/mockup-data/add - Adicionar dados de exemplo"
  });
});

export { router as mockupDataRouter };
