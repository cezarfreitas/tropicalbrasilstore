import { Router } from "express";
import db from "../lib/db";

const router = Router();

// Endpoint temporário para configurar pedido mínimo de teste
router.post("/set-test-minimum/:email", async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email);
    const { minimumOrder } = req.body;

    console.log(`Setting minimum order for ${email}: R$ ${minimumOrder}`);

    // Primeiro verificar se o cliente existe na tabela customers
    const [existingCustomer] = await db.execute(
      `
      SELECT email, minimum_order FROM customers WHERE email = ?
    `,
      [email],
    );

    if (existingCustomer.length > 0) {
      // Cliente já existe, apenas atualizar o minimum_order
      await db.execute(
        `
        UPDATE customers SET minimum_order = ? WHERE email = ?
      `,
        [minimumOrder, email],
      );

      res.json({
        success: true,
        message: `Pedido mínimo atualizado para R$ ${minimumOrder}`,
        action: "updated",
      });
    } else {
      // Cliente não existe na tabela customers, vamos criar com dados básicos
      // Primeiro buscar dados do customer_auth
      const [authData] = await db.execute(
        `
        SELECT name, email, whatsapp FROM customer_auth WHERE email = ?
      `,
        [email],
      );

      if (authData.length > 0) {
        const customer = (authData as any[])[0];
        await db.execute(
          `
          INSERT INTO customers (name, email, whatsapp, minimum_order) 
          VALUES (?, ?, ?, ?)
        `,
          [customer.name, customer.email, customer.whatsapp, minimumOrder],
        );

        res.json({
          success: true,
          message: `Cliente criado na tabela customers com pedido mínimo de R$ ${minimumOrder}`,
          action: "created",
        });
      } else {
        res.status(404).json({
          success: false,
          error: "Cliente não encontrado em customer_auth",
        });
      }
    }
  } catch (error) {
    console.error("Error setting minimum order:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
    });
  }
});

// Endpoint para verificar configuração atual
router.get("/check-minimum/:email", async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email);

    const [result] = await db.execute(
      `
      SELECT email, name, minimum_order FROM customers WHERE email = ?
    `,
      [email],
    );

    if (result.length > 0) {
      res.json({
        success: true,
        customer: result[0],
      });
    } else {
      res.status(404).json({
        success: false,
        error: "Cliente não encontrado na tabela customers",
      });
    }
  } catch (error) {
    console.error("Error checking minimum order:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
    });
  }
});

export { router as debugMinimumOrderRouter };
