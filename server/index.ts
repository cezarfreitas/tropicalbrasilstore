import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { initDatabase } from "./lib/db";
import { categoriesRouter } from "./routes/categories";
import { sizesRouter } from "./routes/sizes";
import { colorsRouter } from "./routes/colors";
import { productsRouter } from "./routes/products";
import { gradesRouter } from "./routes/grades";
import { seedRouter } from "./routes/seed";
import { statsRouter } from "./routes/stats";
import { enhanceRouter } from "./routes/enhance";
import { productsEnhancedRouter } from "./routes/products-enhanced";
import { redesignRouter } from "./routes/redesign";
import { gradesRedesignedRouter } from "./routes/grades-redesigned";
import { storeRouter } from "./routes/store";
import { storeSimpleRouter } from "./routes/store-simple";
import { adminOrdersRouter } from "./routes/admin-orders";
import { adminCustomersRouter } from "./routes/admin-customers";
import { expandedSeedRouter } from "./routes/expanded-seed";
import { createStoreSchema } from "./lib/store-schema";
import { fixOrdersTable } from "./lib/fix-orders-table";
import { checkAndFixTables } from "./lib/check-tables";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Initialize database on startup
  initDatabase().catch(console.error);
  createStoreSchema().catch(console.error);
  fixOrdersTable().catch(console.error);
  checkAndFixTables().catch(console.error);

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
  app.use("/api/products-enhanced", productsEnhancedRouter);
  app.use("/api/grades", gradesRouter);
  app.use("/api/seed", seedRouter);
  app.use("/api/stats", statsRouter);
  app.use("/api/enhance", enhanceRouter);
  app.use("/api/redesign", redesignRouter);
  app.use("/api/grades-redesigned", gradesRedesignedRouter);
  app.use("/api/store", storeSimpleRouter);
  app.use("/api/store-old", storeRouter);
  app.use("/api/admin/orders", adminOrdersRouter);
  app.use("/api/admin/customers", adminCustomersRouter);
  app.use("/api/expanded-seed", expandedSeedRouter);

  return app;
}
