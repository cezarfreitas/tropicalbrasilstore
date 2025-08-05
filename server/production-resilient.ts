import express from "express";
import path from "path";
import { createServer } from "./index.js";

const app = express();

// Configuração básica sem dependência de banco
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Health check básico que sempre funciona
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    database: "checking...",
  });
});

// Servir arquivos estáticos
const staticPath = path.join(process.cwd(), "dist", "spa");
console.log(`🗂️  Serving static files from: ${staticPath}`);

app.use(express.static(staticPath));
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "public", "uploads")),
);

// Tentar inicializar o servidor completo com retry
async function initializeWithRetry() {
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      console.log(
        `🔄 Tentativa ${retryCount + 1}/${maxRetries} de conectar com o banco...`,
      );

      // Criar servidor completo com timeout
      const fullApp = await Promise.race([
        createServer(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout creating server")), 10000),
        ),
      ]);

      console.log("✅ Servidor completo inicializado com sucesso!");
      return fullApp;
    } catch (error) {
      retryCount++;
      console.warn(`⚠️  Tentativa ${retryCount} falhou:`, error.message);

      if (retryCount < maxRetries) {
        console.log(`⏳ Aguardando 5 segundos antes da próxima tentativa...`);
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }

  console.log(
    "❌ Não foi possível conectar com o banco após todas as tentativas",
  );
  console.log("🔄 Iniciando em modo degradado (apenas arquivos estáticos)...");
  return null;
}

// Inicializar servidor
async function startServer() {
  const PORT = process.env.PORT || 80;

  try {
    const fullApp = await initializeWithRetry();

    if (fullApp) {
      // Adicionar rotas estáticas ao servidor completo
      fullApp.use(express.static(staticPath));
      fullApp.use(
        "/uploads",
        express.static(path.join(process.cwd(), "public", "uploads")),
      );

      // Catch-all para SPA
      fullApp.get("*", (req, res) => {
        if (req.path.startsWith("/api/") || req.path.startsWith("/uploads/")) {
          return res.status(404).json({ error: "Not Found" });
        }
        res.sendFile(path.join(staticPath, "index.html"));
      });

      fullApp.listen(PORT, "0.0.0.0", () => {
        console.log(`🚀 Servidor completo rodando na porta ${PORT}`);
        console.log(`🌍 Ambiente: ${process.env.NODE_ENV}`);
        console.log(`💾 Banco de dados: Conectado`);
      });
    } else {
      // Modo degradado - apenas SPA
      console.log("🔧 Iniciando em modo degradado...");

      // API básica para modo degradado
      app.get("/api/*", (req, res) => {
        res.status(503).json({
          error: "Service temporarily unavailable",
          message: "Database connection failed. Please try again later.",
          mode: "degraded",
        });
      });

      // Catch-all para SPA
      app.get("*", (req, res) => {
        if (req.path.startsWith("/uploads/")) {
          return res.status(404).json({ error: "File not found" });
        }
        res.sendFile(path.join(staticPath, "index.html"));
      });

      app.listen(PORT, "0.0.0.0", () => {
        console.log(`🚀 Servidor em modo degradado rodando na porta ${PORT}`);
        console.log(`🌍 Ambiente: ${process.env.NODE_ENV}`);
        console.log(`⚠️  Banco de dados: Indisponível`);
        console.log(`📱 Frontend funcionando normalmente`);
      });
    }
  } catch (error) {
    console.error("❌ Erro fatal ao iniciar servidor:", error);
    process.exit(1);
  }
}

startServer();
