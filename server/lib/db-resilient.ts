import mysql from "mysql2/promise";

// Configuração de conexão resiliente
const createResilientConnection = () => {
  const config = {
    uri: process.env.DATABASE_URL,
    waitForConnections: true,
    connectionLimit: 3,
    queueLimit: 0,
    charset: "utf8mb4",
    connectTimeout: 30000,
    acquireTimeout: 30000,
    timeout: 30000,
  };

  return mysql.createPool(config);
};

let pool: mysql.Pool | null = null;
let isConnected = false;

// Função para testar conexão
async function testConnection(retries = 3): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      if (!pool) {
        pool = createResilientConnection();
      }

      await pool.execute("SELECT 1");
      isConnected = true;
      console.log(
        `✅ Conexão com banco de dados estabelecida (tentativa ${i + 1})`,
      );
      return true;
    } catch (error) {
      console.warn(
        `⚠️  Tentativa ${i + 1}/${retries} de conectar falhou:`,
        error.message,
      );

      if (pool) {
        await pool.end().catch(() => {});
        pool = null;
      }

      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000 * (i + 1)));
      }
    }
  }

  isConnected = false;
  return false;
}

// Wrapper para executar queries com retry automático
async function executeQuery(sql: string, params?: any[]): Promise<any> {
  if (!isConnected) {
    const connected = await testConnection(2);
    if (!connected) {
      throw new Error("Database connection unavailable");
    }
  }

  try {
    if (!pool) {
      throw new Error("Pool not initialized");
    }

    return await pool.execute(sql, params);
  } catch (error) {
    console.error("Query execution error:", error.message);

    // Se for erro de conexão, tentar reconectar
    if (
      error.code === "ECONNRESET" ||
      error.code === "ETIMEDOUT" ||
      error.code === "ENOTFOUND"
    ) {
      console.log("🔄 Tentando reconectar...");
      isConnected = false;

      const reconnected = await testConnection(1);
      if (reconnected && pool) {
        try {
          return await pool.execute(sql, params);
        } catch (retryError) {
          console.error("Retry failed:", retryError.message);
        }
      }
    }

    throw error;
  }
}

// Database instance mockado para quando não há conexão
const mockDb = {
  execute: async (sql: string, params?: any[]) => {
    console.warn(`🚫 Mock DB call: ${sql.substring(0, 50)}...`);

    // Retornar dados mockados para queries específicas
    if (sql.includes("SHOW TABLES")) {
      return [[], []];
    }

    if (sql.includes("SELECT") && sql.includes("store_settings")) {
      return [[], []];
    }

    if (sql.includes("CREATE TABLE")) {
      return [{ affectedRows: 0 }, []];
    }

    return [[], []];
  },
};

// Função principal para obter instância do banco
export async function getDatabase(): Promise<{
  db: any;
  isConnected: boolean;
}> {
  const connected = await testConnection(1);

  if (connected && pool) {
    return {
      db: { execute: executeQuery },
      isConnected: true,
    };
  } else {
    console.warn("🔄 Usando mock database (modo degradado)");
    return {
      db: mockDb,
      isConnected: false,
    };
  }
}

// Função para inicializar banco com fallback
export async function initResilientDatabase() {
  console.log("🔧 Inicializando conexão resiliente com banco...");

  const { db, isConnected: connected } = await getDatabase();

  if (connected) {
    console.log("✅ Banco de dados conectado e pronto");
    try {
      // Executar inicializações básicas
      const [tables] = await db.execute("SHOW TABLES");
      console.log(`📊 Encontradas ${tables.length} tabelas no banco`);
    } catch (error) {
      console.warn("⚠️  Erro ao verificar tabelas:", error.message);
    }
  } else {
    console.log("⚠️  Banco indisponível - modo degradado ativo");
  }

  return { db, isConnected: connected };
}

export { executeQuery };
