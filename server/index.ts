import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { initDatabase } from "./lib/db";
import { categoriesRouter } from "./routes/categories";
import { sizesRouter } from "./routes/sizes";
import { colorsRouter } from "./routes/colors";
import { productsRouter } from "./routes/products";
import { gradesRouter } from "./routes/grades";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Initialize database on startup
  initDatabase().catch(console.error);

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "Chinelos Admin API v1.0" });
  });

  app.get("/api/demo", handleDemo);

  // API routes
  app.use("/api/categories", categoriesRouter);
  app.use("/api/sizes", sizesRouter);
  app.use("/api/colors", colorsRouter);
  app.use("/api/products", productsRouter);
  app.use("/api/grades", gradesRouter);

  return app;
}
