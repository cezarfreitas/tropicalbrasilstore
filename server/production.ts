import path from "path";
import express from "express";
import { createServer as createViteServer } from "vite";

import { createServer } from "./index.js";

const app = createServer();

const staticPath = path.join(process.cwd(), "dist", "spa");

const vite = await createViteServer({
  root: staticPath,
  server: { middlewareMode: "html" },
});

app.use(vite.middlewares);

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Production server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(
    `💾 Database: ${process.env.DATABASE_URL ? "Connected" : "No URL set"}`,
  );
});