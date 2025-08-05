import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "server/production.ts"),
      name: "server",
      fileName: "production",
      formats: ["es"],
    },
    outDir: "dist/server",
    target: "node18",
    ssr: true,
    reportCompressedSize: false,
    rollupOptions: {
      external: [
        // Node.js built-ins
        "fs",
        "path",
        "url",
        "http",
        "https",
        "os",
        "crypto",
        "stream",
        "util",
        "events",
        "buffer",
        "querystring",
        "child_process",
        // Dependencies
        "express",
        "cors",
        "mysql2",
        "nodemailer",
        "sharp",
        "axios",
        "bcryptjs",
        "jsonwebtoken",
        "multer",
        "csv-parser",
        "xlsx",
        "zod",
        "node-fetch",
        /^node:.*/,
      ],
      output: {
        format: "es",
        entryFileNames: "[name].js",
      },
    },
    minify: false,
    sourcemap: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  define: {
    "process.env.NODE_ENV": '"production"',
  },
});
