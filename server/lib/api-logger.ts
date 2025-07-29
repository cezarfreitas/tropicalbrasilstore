import { Request, Response, NextFunction } from "express";
import db from "./db";

interface LogEntry {
  method: string;
  endpoint: string;
  user_agent?: string;
  ip_address?: string;
  request_headers: any;
  request_body: any;
  response_status?: number;
  response_time_ms?: number;
  error_message?: string;
}

export function createApiLogger(pathPattern: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only log requests that match the pattern
    if (!req.path.includes(pathPattern)) {
      return next();
    }

    const startTime = Date.now();
    const originalSend = res.send;

    // Prepare log entry
    const logEntry: LogEntry = {
      method: req.method,
      endpoint: req.path,
      user_agent: req.get("User-Agent"),
      ip_address: req.ip || req.connection.remoteAddress,
      request_headers: req.headers,
      request_body: req.body || null,
    };

    // Override res.send to capture response
    res.send = function (body: any) {
      const endTime = Date.now();
      logEntry.response_status = res.statusCode;
      logEntry.response_time_ms = endTime - startTime;

      // Log to database (async, don't block response)
      saveLogEntry(logEntry).catch((error) => {
        console.error("Error saving API log:", error);
      });

      // Call original send
      return originalSend.call(this, body);
    };

    // Handle errors
    res.on("error", (error: Error) => {
      logEntry.error_message = error.message;
      logEntry.response_status = res.statusCode || 500;
      logEntry.response_time_ms = Date.now() - startTime;

      saveLogEntry(logEntry).catch((err) => {
        console.error("Error saving API error log:", err);
      });
    });

    next();
  };
}

async function saveLogEntry(logEntry: LogEntry) {
  try {
    await db.execute(
      `INSERT INTO api_logs 
       (method, endpoint, user_agent, ip_address, request_headers, request_body, 
        response_status, response_time_ms, error_message) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        logEntry.method,
        logEntry.endpoint,
        logEntry.user_agent || null,
        logEntry.ip_address || null,
        JSON.stringify(logEntry.request_headers),
        JSON.stringify(logEntry.request_body),
        logEntry.response_status || null,
        logEntry.response_time_ms || null,
        logEntry.error_message || null,
      ],
    );
  } catch (error) {
    console.error("Database error saving API log:", error);
  }
}

export { LogEntry };
