import express from "express";
import cors from "cors";
import path from "path";
import { handleDemo } from "./routes/demo";
import { initDatabase } from "./lib/db";
import { categoriesRouter } from "./routes/categories";
import { sizesRouter } from "./routes/sizes";
import { sizeGroupsRouter } from "./routes/size-groups";
import { colorsRouter } from "./routes/colors";
import { gendersRouter } from "./routes/genders";
import { typesRouter } from "./routes/types";
import { brandsRouter } from "./routes/brands";
import { productsRouter } from "./routes/products";
import { seedRouter } from "./routes/seed";
import { statsRouter } from "./routes/stats";
import { enhanceRouter } from "./routes/enhance";
import { productsEnhancedRouter } from "./routes/products-enhanced";
import { productsWooCommerceRouter } from "./routes/products-woocommerce";
import { productsByNamesRouter } from "./routes/products-by-names";
import { redesignRouter } from "./routes/redesign";
import { gradesRedesignedRouter } from "./routes/grades-redesigned";
import { storeRouter } from "./routes/store";
import { uploadRouter } from "./routes/upload";
import { storeSimpleRouter } from "./routes/store-simple";
import { adminOrdersRouter } from "./routes/admin-orders";
import { adminCustomersRouter } from "./routes/admin-customers";
import { expandedSeedRouter } from "./routes/expanded-seed";
import { settingsRouter } from "./routes/settings";
import { debugMinimumOrderRouter } from "./routes/debug-minimum-order";
import { debugDatabaseRouter } from "./routes/debug-database";
import { fixColorsRouter } from "./routes/fix-colors";
import { notificationsRouter } from "./routes/notifications";
import { customerAuthRouter } from "./routes/customer-auth";
import { customerOrdersRouter } from "./routes/customer-orders";
import { mockupDataRouter } from "./routes/mockup-data";
import { importRouter } from "./routes/import";
import { resetProductsRouter } from "./routes/reset-products";
import { verifyProductsRouter } from "./routes/verify-products";
import { cleanupProductsRouter } from "./routes/cleanup-products";
import { seedChinelosRouter } from "./routes/seed-chinelos";
import { apiLogsRouter } from "./routes/api-logs";
import { stockManagementRouter } from "./routes/stock-management";
import { vendorsRouter } from "./routes/vendors";
import vendorAuthRouter from "./routes/vendor-auth";
import vendorDashboardRouter from "./routes/vendor-dashboard";
import vendorReferralRouter from "./routes/vendor-referral";
import { createStoreSchema } from "./lib/store-schema";
import { fixOrdersTable } from "./lib/fix-orders-table";
import { checkAndFixTables } from "./lib/check-tables";
import { createNotificationSettings } from "./lib/notification-settings";
import { createCustomerAuthTable } from "./lib/create-customer-auth-table";
import { addSellWithoutStockColumn } from "./lib/add-sell-without-stock";
import { addParentSkuColumn } from "./lib/add-parent-sku";
import { addParentIdColumn } from "./lib/add-parent-id-column";
import { addBrandsTable } from "./lib/add-brands-table";
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
import { addVariantImageColumn } from "./lib/add-variant-image-column";
import { addColorVariantsTable } from "./lib/add-color-variants-table";
import { addShowInMenuColumn } from "./lib/add-show-in-menu-column";
import { addGendersTypesTable } from "./lib/add-genders-types-tables";
import { createApiLogsTable } from "./lib/create-api-logs-table";
import { createApiLogger } from "./lib/api-logger";
import { injectStoreSettings } from "./lib/inject-store-settings";
import { createVendorsSystem } from "./lib/create-vendors-system";
import { addVendorPassword } from "./lib/add-vendor-password";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());

  // Configure charset to UTF-8 for proper encoding of special characters
  app.use((req, res, next) => {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    next();
  });

  app.use(express.json({ limit: "50mb" })); // Increase limit for large CSV imports
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // API logging middleware for /admin/api routes only
  app.use(createApiLogger("/admin/api"));

  // Inject store settings into HTML responses
  app.use(injectStoreSettings);

  // Serve static files for uploads
  app.use(
    "/uploads",
    express.static(path.join(process.cwd(), "public", "uploads")),
  );

  // Initialize database on startup - run sequentially to avoid dependency issues
  // Continue serving frontend even if database fails
  (async () => {
    try {
      console.log("🔄 Initializing database...");
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
      await addVariantImageColumn(); // Add image_url column to product_variants
      await addColorVariantsTable(); // Create WooCommerce-style color variants system
      await redesignGradeSystem(); // Create grade templates and product color grades tables
      await createStoreSettingsTable(); // Create store settings table
      await addDesignColumns(); // Add design customization columns
      await addShowInMenuColumn(); // Add show_in_menu column to categories
      await addGendersTypesTable(); // Add genders and types tables
      await addBrandsTable(); // Add brands table
      await createApiLogsTable(); // Create API logs table
      await createVendorsSystem(); // Create vendors system tables
      await addVendorPassword(); // Add password column to vendors
      await fixOrdersTable(); // Fix any missing columns
      await checkAndFixTables(); // Final table structure checks
      console.log("✅ All database initialization completed successfully");
    } catch (error) {
      console.error("⚠️ Banco de dados não conectado:", error.message);
      console.log("🚀 Continuando a servir o frontend mesmo sem backend...");
      console.log("📱 Frontend funcionará com dados mock/locais");
      // continuar renderizando o frontend mesmo sem backend
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
  app.use("/api/genders", gendersRouter);
  app.use("/api/types", typesRouter);
  app.use("/api/brands", brandsRouter);
  app.use("/api/products", productsRouter);
  app.use("/api/products-enhanced", productsEnhancedRouter);
  app.use("/api/products-woocommerce", productsWooCommerceRouter);
  app.use("/api/products-by-names", productsByNamesRouter);
  app.use("/api/grades", gradesRedesignedRouter);
  app.use("/api/seed", seedRouter);
  app.use("/api/stats", statsRouter);
  app.use("/api/enhance", enhanceRouter);
  app.use("/api/redesign", redesignRouter);
  app.use("/api/grades-redesigned", gradesRedesignedRouter);
  app.use("/api/upload", uploadRouter);
  app.use("/api/fix-colors", fixColorsRouter);
  app.use("/api/store", storeSimpleRouter);
  app.use("/api/store-old", storeRouter);
  app.use("/api/admin/orders", adminOrdersRouter);
  app.use("/api/admin/customers", adminCustomersRouter);
  app.use("/api/customers", customerAuthRouter);
  app.use("/api/customer-orders", customerOrdersRouter);
  app.use("/api/settings", settingsRouter);
  app.use("/api/expanded-seed", expandedSeedRouter);
  app.use("/api/notifications", notificationsRouter);
  app.use("/api/mockup-data", mockupDataRouter);
  app.use("/api/reset-products", resetProductsRouter);
  app.use("/api/verify-products", verifyProductsRouter);
  app.use("/api/cleanup-products", cleanupProductsRouter);
  app.use("/api/seed-chinelos", seedChinelosRouter);
  app.use("/api/import", importRouter);
  app.use("/api/admin/logs", apiLogsRouter);
  app.use("/api", stockManagementRouter);
  app.use("/api/vendors", vendorsRouter);
  app.use("/api/vendor/auth", vendorAuthRouter);
  app.use("/api/vendor/dashboard", vendorDashboardRouter);
  app.use("/api/vendor/referral", vendorReferralRouter);
  app.use("/api/debug-minimum-order", debugMinimumOrderRouter);

  return app;
}
