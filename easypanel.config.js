// Configuração específica para Easypanel
export const easypanelConfig = {
  // Configurações de build otimizadas
  build: {
    timeout: 40000, // 40 segundos para client
    serverTimeout: 25000, // 25 segundos para server
    fallbackTimeout: 80000, // 80 segundos para fallback
    maxMemory: "2048MB",
  },
  
  // Variáveis de ambiente recomendadas
  env: {
    NODE_ENV: "production",
    VITE_BUILD_FAST: "true",
    CI: "true",
    DISABLE_ESLINT_PLUGIN: "true",
    VITE_DISABLE_DEV_LOGS: "true",
    NODE_OPTIONS: "--max-old-space-size=2048",
    DB_CONNECTION_LIMIT: "3", // Reduzido para deploy
  },
  
  // Configurações do Docker
  docker: {
    nodeVersion: "18-alpine",
    buildArgs: {
      NODE_ENV: "production",
      VITE_BUILD_FAST: "true",
    },
    healthcheck: {
      interval: "30s",
      timeout: "3s",
      startPeriod: "5s",
      retries: 3,
    },
  },
  
  // Comandos recomendados
  commands: {
    build: "npm run build:deploy",
    start: "npm start",
    health: "/health",
  },
};
