import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { initDatabase } from "./lib/db";
import { categoriesRouter } from "./routes/categories";
import { sizesRouter } from "./routes/sizes";
import { sizeGroupsRouter } from "./routes/size-groups";
import { colorsRouter } from "./routes/colors";
import { productsRouter } from "./routes/products";
import { gradesRouter } from "./routes/grades";
import { seedRouter } from "./routes/seed";
import { statsRouter } from "./routes/stats";
import { enhanceRouter } from "./routes/enhance";
import { productsEnhancedRouter } from "./routes/products-enhanced";
import { productsByNamesRouter } from "./routes/products-by-names";
import { redesignRouter } from "./routes/redesign";
import { gradesRedesignedRouter } from "./routes/grades-redesigned";
import { storeRouter } from "./routes/store";
import { storeSimpleRouter } from "./routes/store-simple";
import { adminOrdersRouter } from "./routes/admin-orders";
import { adminCustomersRouter } from "./routes/admin-customers";
import { expandedSeedRouter } from "./routes/expanded-seed";
import { settingsRouter } from "./routes/settings";
import { notificationsRouter } from "./routes/notifications";
import { customerAuthRouter } from "./routes/customer-auth";
import { mockupDataRouter } from "./routes/mockup-data";
import { importRouter } from "./routes/import";
import { resetProductsRouter } from "./routes/reset-products";
import { verifyProductsRouter } from "./routes/verify-products";
import { seedChinelosRouter } from "./routes/seed-chinelos";
import { createStoreSchema } from "./lib/store-schema";
import { fixOrdersTable } from "./lib/fix-orders-table";
import { checkAndFixTables } from "./lib/check-tables";
import { createNotificationSettings } from "./lib/notification-settings";
import { createCustomerAuthTable } from "./lib/create-customer-auth-table";
import { addSellWithoutStockColumn } from "./lib/add-sell-without-stock";
import { addParentSkuColumn } from "./lib/add-parent-sku";
import { addParentIdColumn } from "./lib/add-parent-id-column";
import { addSizeGroupsTable } from "./lib/add-size-groups-table";
import { createProductVariantsTable } from "./lib/create-product-variants";
import { addPriceOverrideColumn } from "./lib/add-price-override-column";
import { addSuggestedPriceColumn } from "./lib/add-suggested-price-column";
import { addPhotoColumn } from "./lib/add-photo-column";
import { redesignGradeSystem } from "./lib/redesign-grades";
import { createStoreSettingsTable } from "./lib/create-settings-table";
import { addDesignColumns } from "./lib/add-design-columns";
import { addMinimumOrderColumn } from "./lib/add-minimum-order-column";
import { addSalePriceColumn } from "./lib/add-sale-price-column";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Initialize database on startup - run sequentially to avoid dependency issues
  (async () => {
    try {
      await initDatabase(); // This creates base tables and seeds data
      await createStoreSchema(); // This creates store-specific tables (customers, orders, order_items)
      await createCustomerAuthTable(); // Authentication tables
      await createNotificationSettings(); // Settings tables
      await addSellWithoutStockColumn(); // Add sell without stock functionality
      await addParentSkuColumn(); // Add parent SKU for variant grouping
      await addParentIdColumn(); // Add parent ID for product hierarchy
      await addSizeGroupsTable(); // Add size groups table and default data
      await createProductVariantsTable(); // Create product variants table
      await addPriceOverrideColumn(); // Add price_override column to product_variants
      await addSuggestedPriceColumn(); // Add suggested_price column to products
      await addPhotoColumn(); // Add photo column to products
      await addMinimumOrderColumn(); // Add minimum_order column to customers
      await addSalePriceColumn(); // Add sale_price column to products
      await redesignGradeSystem(); // Create grade templates and product color grades tables
      await createStoreSettingsTable(); // Create store settings table
      await addDesignColumns(); // Add design customization columns
      await fixOrdersTable(); // Fix any missing columns
      await checkAndFixTables(); // Final table structure checks
      console.log("✅ All database initialization completed successfully");
    } catch (error) {
      console.error("❌ Database initialization failed:", error);
    }
  })();

  // Health check endpoint
  app.get("/health", (_req, res) => {
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development",
    });
  });

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "Chinelos Admin API v1.0" });
  });

  app.get("/api/demo", handleDemo);

  // API routes
  app.use("/api/categories", categoriesRouter);
  app.use("/api/sizes", sizesRouter);
  app.use("/api/size-groups", sizeGroupsRouter);
  app.use("/api/colors", colorsRouter);
  app.use("/api/products", productsRouter);
  app.use("/api/products-enhanced", productsEnhancedRouter);
  app.use("/api/products-by-names", productsByNamesRouter);
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
  app.use("/api/customers", customerAuthRouter);
  app.use("/api/settings", settingsRouter);
  app.use("/api/expanded-seed", expandedSeedRouter);
  app.use("/api/notifications", notificationsRouter);
  app.use("/api/mockup-data", mockupDataRouter);
  app.use("/api/reset-products", resetProductsRouter);
  app.use("/api/verify-products", verifyProductsRouter);
  app.use("/api/seed-chinelos", seedChinelosRouter);
  app.use("/api/import", importRouter);

  return app;
}
