import { Router } from "express";
import db from "../lib/db";

const router = Router();

// Get API logs with filtering and pagination
router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      method,
      endpoint,
      status,
      from_date,
      to_date
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    
    // Build WHERE clause
    let whereConditions = [];
    let queryParams = [];

    if (method) {
      whereConditions.push("method = ?");
      queryParams.push(method);
    }

    if (endpoint) {
      whereConditions.push("endpoint LIKE ?");
      queryParams.push(`%${endpoint}%`);
    }

    if (status) {
      whereConditions.push("response_status = ?");
      queryParams.push(Number(status));
    }

    if (from_date) {
      whereConditions.push("created_at >= ?");
      queryParams.push(from_date);
    }

    if (to_date) {
      whereConditions.push("created_at <= ?");
      queryParams.push(to_date);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(" AND ")}` 
      : "";

    // Get total count
    const [countResult] = await db.execute(
      `SELECT COUNT(*) as total FROM api_logs ${whereClause}`,
      queryParams
    );
    const total = (countResult as any[])[0].total;

    // Get logs with pagination
    const [logs] = await db.execute(
      `SELECT 
        id,
        method,
        endpoint,
        user_agent,
        ip_address,
        response_status,
        response_time_ms,
        error_message,
        created_at
      FROM api_logs 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?`,
      [...queryParams, Number(limit), offset]
    );

    res.json({
      logs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });

  } catch (error) {
    console.error("Error fetching API logs:", error);
    res.status(500).json({ error: "Erro ao buscar logs da API" });
  }
});

// Get API statistics
router.get("/stats", async (req, res) => {
  try {
    const { from_date, to_date } = req.query;
    
    let whereClause = "";
    let queryParams = [];

    if (from_date) {
      whereClause += whereClause ? " AND " : " WHERE ";
      whereClause += "created_at >= ?";
      queryParams.push(from_date);
    }

    if (to_date) {
      whereClause += whereClause ? " AND " : " WHERE ";
      whereClause += "created_at <= ?";
      queryParams.push(to_date);
    }

    // Get request statistics
    const [stats] = await db.execute(`
      SELECT 
        COUNT(*) as total_requests,
        COUNT(CASE WHEN response_status >= 200 AND response_status < 300 THEN 1 END) as success_requests,
        COUNT(CASE WHEN response_status >= 400 THEN 1 END) as error_requests,
        AVG(response_time_ms) as avg_response_time,
        MAX(response_time_ms) as max_response_time,
        MIN(response_time_ms) as min_response_time
      FROM api_logs 
      ${whereClause}
    `, queryParams);

    // Get most frequent endpoints
    const [endpoints] = await db.execute(`
      SELECT 
        endpoint,
        method,
        COUNT(*) as request_count,
        AVG(response_time_ms) as avg_response_time
      FROM api_logs 
      ${whereClause}
      GROUP BY endpoint, method
      ORDER BY request_count DESC
      LIMIT 10
    `, queryParams);

    // Get status code distribution
    const [statusCodes] = await db.execute(`
      SELECT 
        response_status,
        COUNT(*) as count
      FROM api_logs 
      ${whereClause}
      GROUP BY response_status
      ORDER BY count DESC
    `, queryParams);

    res.json({
      overview: (stats as any[])[0],
      top_endpoints: endpoints,
      status_distribution: statusCodes
    });

  } catch (error) {
    console.error("Error fetching API stats:", error);
    res.status(500).json({ error: "Erro ao buscar estatísticas da API" });
  }
});

// Clear old logs
router.delete("/cleanup", async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const [result] = await db.execute(
      `DELETE FROM api_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [Number(days)]
    );

    res.json({ 
      message: `Logs antigos removidos com sucesso`,
      deleted_count: (result as any).affectedRows
    });

  } catch (error) {
    console.error("Error cleaning up API logs:", error);
    res.status(500).json({ error: "Erro ao limpar logs antigos" });
  }
});

export { router as apiLogsRouter };
