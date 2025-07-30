import { Router } from "express";
import db from "../lib/db";
import { verifyToken } from "../lib/auth-utils";

const router = Router();

// Middleware para autenticação de vendedor
const authenticateVendor = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);

  if (!decoded || decoded.type !== 'vendor') {
    return res.status(401).json({ error: "Token inválido" });
  }

  req.vendorId = decoded.id;
  next();
};

// Estatísticas do dashboard
router.get("/stats", authenticateVendor, async (req: any, res) => {
  try {
    const vendorId = req.vendorId;

    // Total de pedidos
    const [ordersResult] = await db.execute(
      "SELECT COUNT(*) as total FROM orders WHERE vendor_id = ?",
      [vendorId]
    );
    const totalOrders = (ordersResult as any[])[0].total;

    // Total de pedidos hoje
    const [todayOrdersResult] = await db.execute(
      "SELECT COUNT(*) as total FROM orders WHERE vendor_id = ? AND DATE(created_at) = CURDATE()",
      [vendorId]
    );
    const todayOrders = (todayOrdersResult as any[])[0].total;

    // Total de clientes atribuídos
    const [customersResult] = await db.execute(
      "SELECT COUNT(*) as total FROM customers WHERE vendor_id = ?",
      [vendorId]
    );
    const totalCustomers = (customersResult as any[])[0].total;

    // Total de comissões
    const [commissionsResult] = await db.execute(
      "SELECT SUM(commission_amount) as total FROM vendor_commissions WHERE vendor_id = ?",
      [vendorId]
    );
    const totalCommissions = (commissionsResult as any[])[0].total || 0;

    // Comissões este mês
    const [monthCommissionsResult] = await db.execute(
      "SELECT SUM(commission_amount) as total FROM vendor_commissions WHERE vendor_id = ? AND MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())",
      [vendorId]
    );
    const monthCommissions = (monthCommissionsResult as any[])[0].total || 0;

    // Valor total de vendas
    const [salesResult] = await db.execute(
      "SELECT SUM(total_amount) as total FROM orders WHERE vendor_id = ? AND status IN ('completed', 'shipped')",
      [vendorId]
    );
    const totalSales = (salesResult as any[])[0].total || 0;

    res.json({
      totalOrders,
      todayOrders,
      totalCustomers,
      totalCommissions,
      monthCommissions,
      totalSales
    });

  } catch (error) {
    console.error("Erro ao obter estatísticas:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Pedidos do vendedor
router.get("/orders", authenticateVendor, async (req: any, res) => {
  try {
    const vendorId = req.vendorId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string || "all";

    const offset = (page - 1) * limit;

    let whereClause = "WHERE o.vendor_id = ?";
    const params: any[] = [vendorId];

    if (status !== "all") {
      whereClause += " AND o.status = ?";
      params.push(status);
    }

    // Contar total
    const [countResult] = await db.execute(
      `SELECT COUNT(*) as total FROM orders o ${whereClause}`,
      params
    );
    const total = (countResult as any[])[0].total;

    // Buscar pedidos
    const [orders] = await db.execute(
      `SELECT
        o.*,
        c.name as customer_name,
        o.customer_email,
        vc.commission_amount
      FROM orders o
      LEFT JOIN customers c ON o.customer_email = c.email
      LEFT JOIN vendor_commissions vc ON o.id = vc.order_id
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("Erro ao obter pedidos:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Clientes do vendedor
router.get("/customers", authenticateVendor, async (req: any, res) => {
  try {
    const vendorId = req.vendorId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string || "";

    const offset = (page - 1) * limit;

    let whereClause = "WHERE vendor_id = ?";
    const params: any[] = [vendorId];

    if (search) {
      whereClause += " AND (name LIKE ? OR email LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    // Contar total
    const [countResult] = await db.execute(
      `SELECT COUNT(*) as total FROM customers ${whereClause}`,
      params
    );
    const total = (countResult as any[])[0].total;

    // Buscar clientes
    const [customers] = await db.execute(
      `SELECT * FROM customers ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      customers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("Erro ao obter clientes:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Comissões do vendedor
router.get("/commissions", authenticateVendor, async (req: any, res) => {
  try {
    const vendorId = req.vendorId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const month = req.query.month as string;

    const offset = (page - 1) * limit;

    let whereClause = "WHERE vc.vendor_id = ?";
    const params: any[] = [vendorId];

    if (month) {
      whereClause += " AND DATE_FORMAT(vc.created_at, '%Y-%m') = ?";
      params.push(month);
    }

    // Contar total
    const [countResult] = await db.execute(
      `SELECT COUNT(*) as total FROM vendor_commissions vc ${whereClause}`,
      params
    );
    const total = (countResult as any[])[0].total;

    // Buscar comissões
    const [commissions] = await db.execute(
      `SELECT 
        vc.*,
        o.id as order_id,
        o.total as order_total,
        o.status as order_status,
        c.name as customer_name
      FROM vendor_commissions vc
      LEFT JOIN orders o ON vc.order_id = o.id
      LEFT JOIN customers c ON o.customer_id = c.id
      ${whereClause}
      ORDER BY vc.created_at DESC
      LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      commissions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("Erro ao obter comissões:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Resumo mensal de comissões
router.get("/commissions/monthly", authenticateVendor, async (req: any, res) => {
  try {
    const vendorId = req.vendorId;

    const [monthlyCommissions] = await db.execute(
      `SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as total_commissions,
        SUM(commission_amount) as total_amount
      FROM vendor_commissions 
      WHERE vendor_id = ?
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month DESC
      LIMIT 12`,
      [vendorId]
    );

    res.json({ monthlyCommissions });

  } catch (error) {
    console.error("Erro ao obter resumo mensal:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;
