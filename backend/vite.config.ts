import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  build: {
    outDir: "dist",
    target: "node18",
    ssr: true,
    lib: {
      entry: "src/index.ts",
      name: "server",
      fileName: "production",
      formats: ["es"],
    },
    rollupOptions: {
      external: [
        // Node.js built-ins
        "fs",
        "path",
        "url",
        "crypto",
        "http",
        "https",
        "stream",
        "util",
        "events",
        "buffer",
        "querystring",
        "os",
        "child_process",
        // Dependencies that should remain external
        "express",
        "mysql2",
        "bcryptjs",
        "jsonwebtoken",
        "multer",
        "sharp",
        "nodemailer",
        "compression",
        "helmet",
        "cors",
        "csv-parser",
        "xlsx",
        "node-fetch",
      ],
      output: {
        format: "es",
      },
    },
    minify: false,
    sourcemap: true,
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
