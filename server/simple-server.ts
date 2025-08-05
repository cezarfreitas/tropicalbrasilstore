import express from "express";
import path from "path";
import cors from "cors";

const app = express();

// Middleware básico
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Health check que sempre funciona
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0-simple",
    environment: process.env.NODE_ENV || "development",
    mode: "simple",
  });
});

// API básica (sem banco)
app.get("/api/ping", (_req, res) => {
  res.json({ message: "Chinelos Store API - Modo Simples" });
});

// Mock de dados para demonstração
const mockProducts = [
  {
    id: 1,
    name: "Chinelo Exemplo",
    price: 29.9,
    photo: "/placeholder.svg",
  },
];

app.get("/api/store/products", (_req, res) => {
  res.json({
    products: mockProducts,
    message: "Dados de demonstração - conecte o banco para dados reais",
  });
});

// Outras APIs retornam dados de exemplo
app.get("/api/*", (req, res) => {
  res.json({
    message: "API em modo demonstração",
    endpoint: req.path,
    note: "Conecte o banco de dados para funcionalidade completa",
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

// Catch-all para SPA
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/") || req.path.startsWith("/uploads/")) {
    return res.status(404).json({ error: "Not Found" });
  }
  res.sendFile(path.join(staticPath, "index.html"));
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Servidor simples rodando na porta ${PORT}`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV}`);
  console.log(`📱 Frontend: Funcionando`);
  console.log(`🔧 Modo: Simples (sem banco de dados)`);
  console.log(`📍 URL: http://localhost:${PORT}`);
});
