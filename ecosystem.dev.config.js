module.exports = {
  apps: [
    {
      name: "chinelos-dev",
      script: "dist/server/production.js",
      cwd: "./",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "development",
        PORT: 80,
        DATABASE_URL:
          "mysql://tropical:805ce7692e5b4d6ced5f@5.161.52.206:3232/tropical",
        JWT_SECRET: "tropical-brasil-secret-key-2025-dev",
        CORS_ORIGIN: "http://localhost",
        DEBUG_MODE: "true",
        LOG_LEVEL: "debug",
        ENABLE_COMPRESSION: "false",
        ENABLE_CACHING: "false",
      },
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      out_file: "./logs/dev-out.log",
      error_file: "./logs/dev-error.log",
      merge_logs: true,
      time: true,
    },
  ],
};
