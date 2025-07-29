import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const API_KEYS_STORAGE_KEY = "api-keys-database.json";

// Funções para gerenciar o arquivo JSON das chaves
function loadApiKeysFromJson(): ApiKeysDatabase {
  try {
    const jsonData = localStorage.getItem(API_KEYS_STORAGE_KEY);
    if (jsonData) {
      const parsed = JSON.parse(jsonData) as ApiKeysDatabase;
      // Validar estrutura básica
      if (parsed.version && parsed.api_keys && Array.isArray(parsed.api_keys)) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn("Erro ao carregar arquivo JSON de chaves:", error);
  }

  // Retorna estrutura padrão se não existir ou estiver corrompida
  return createDefaultApiKeysDatabase();
}

function saveApiKeysToJson(database: ApiKeysDatabase): void {
  try {
    database.updated_at = new Date().toISOString();
    const jsonData = JSON.stringify(database, null, 2);
    localStorage.setItem(API_KEYS_STORAGE_KEY, jsonData);
    console.log("Chaves de API salvas em:", API_KEYS_STORAGE_KEY);
  } catch (error) {
    console.error("Erro ao salvar arquivo JSON de chaves:", error);
  }
}

function createDefaultApiKeysDatabase(): ApiKeysDatabase {
  const now = new Date().toISOString();
  return {
    version: "1.0.0",
    created_at: now,
    updated_at: now,
    api_keys: [
      {
        id: "1",
        name: "Chave Principal",
        key: "sk_live_abcd1234567890abcdef1234567890abcdef12",
        created_at: now,
        last_used: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        status: "active"
      },
      {
        id: "2",
        name: "Integração Mobile",
        key: "sk_live_xyz9876543210xyz9876543210xyz987654321",
        created_at: new Date(Date.now() - 7 * 86400000).toISOString(), // 7 days ago
        status: "active"
      }
    ]
  };
}

function generateApiKey(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'sk_live_';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

interface ApiKey {
  id: string;
  name: string;
  key: string;
  created_at: string;
  last_used?: string;
  status: "active" | "revoked";
}

interface CreateApiKeyRequest {
  name: string;
  description?: string;
}

interface ApiKeysDatabase {
  version: string;
  created_at: string;
  updated_at: string;
  api_keys: ApiKey[];
}

export function useApiKeys() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [database, setDatabase] = useState<ApiKeysDatabase | null>(null);
  const { toast } = useToast();

  // Load API keys on mount
  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      setLoading(true);

      // Primeiro, tenta carregar do JSON local
      const localDatabase = loadApiKeysFromJson();
      setDatabase(localDatabase);
      setApiKeys(localDatabase.api_keys);

      console.log("Chaves de API carregadas do arquivo JSON:", API_KEYS_STORAGE_KEY);
      console.log("Database version:", localDatabase.version);
      console.log("Total de chaves:", localDatabase.api_keys.length);
    } catch (error) {
      console.error("Erro ao carregar chaves de API:", error);

      // Fallback: cria banco padrão
      const defaultDb = createDefaultApiKeysDatabase();
      setDatabase(defaultDb);
      setApiKeys(defaultDb.api_keys);
      saveApiKeysToJson(defaultDb);
    } finally {
      setLoading(false);
    }
  };

  const updateDatabase = (updatedKeys: ApiKey[]) => {
    if (database) {
      const updatedDatabase = {
        ...database,
        api_keys: updatedKeys,
        updated_at: new Date().toISOString()
      };
      setDatabase(updatedDatabase);
      setApiKeys(updatedKeys);
      saveApiKeysToJson(updatedDatabase);
    }
  };

  const createApiKey = async (request: CreateApiKeyRequest): Promise<ApiKey | null> => {
    try {
      const newKey: ApiKey = {
        id: Date.now().toString(),
        name: request.name,
        key: generateApiKey(),
        created_at: new Date().toISOString(),
        status: "active"
      };

      const updatedKeys = [...apiKeys, newKey];
      updateDatabase(updatedKeys);

      toast({
        title: "Chave criada com sucesso",
        description: `A chave "${request.name}" foi criada e salva no arquivo JSON.`,
      });

      console.log("Nova chave criada:", {
        id: newKey.id,
        name: newKey.name,
        created_at: newKey.created_at
      });

      return newKey;
    } catch (error) {
      console.error("Erro ao criar chave de API:", error);
      toast({
        title: "Erro ao criar chave",
        description: "Não foi possível criar a chave de API.",
        variant: "destructive",
      });
      return null;
    }
  };

  const revokeApiKey = async (keyId: string): Promise<boolean> => {
    try {
      const updatedKeys = apiKeys.map(key =>
        key.id === keyId ? { ...key, status: "revoked" as const } : key
      );

      updateDatabase(updatedKeys);

      toast({
        title: "Chave revogada",
        description: "A chave de API foi revogada e salva no arquivo JSON.",
      });

      console.log("Chave revogada:", keyId);
      return true;
    } catch (error) {
      console.error("Erro ao revogar chave de API:", error);
      toast({
        title: "Erro ao revogar chave",
        description: "Não foi possível revogar a chave de API.",
        variant: "destructive",
      });
      return false;
    }
  };

  const regenerateApiKey = async (keyId: string): Promise<ApiKey | null> => {
    try {
      const newKeyValue = generateApiKey();
      const updatedKeys = apiKeys.map(key =>
        key.id === keyId ? { ...key, key: newKeyValue } : key
      );

      updateDatabase(updatedKeys);

      toast({
        title: "Chave regenerada",
        description: "Uma nova chave foi gerada e salva no arquivo JSON.",
      });

      const updatedKey = updatedKeys.find(k => k.id === keyId);
      console.log("Chave regenerada:", keyId, "Nova chave gerada");

      return updatedKey || null;
    } catch (error) {
      console.error("Erro ao regenerar chave de API:", error);
      toast({
        title: "Erro ao regenerar chave",
        description: "Não foi possível regenerar a chave de API.",
        variant: "destructive",
      });
      return null;
    }
  };

  return {
    apiKeys,
    loading,
    usingMockData,
    createApiKey,
    revokeApiKey,
    regenerateApiKey,
    reload: loadApiKeys,
  };
}

export type { ApiKey, CreateApiKeyRequest };
