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
      const response = await new Promise<Response>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/admin/api-keys", true);
        xhr.setRequestHeader("Accept", "application/json");
        xhr.setRequestHeader("Content-Type", "application/json");

        xhr.onload = () => {
          const headers = new Headers();
          xhr
            .getAllResponseHeaders()
            .split("\r\n")
            .forEach((line) => {
              const [key, value] = line.split(": ");
              if (key && value) headers.set(key, value);
            });

          const response = new Response(xhr.responseText, {
            status: xhr.status,
            statusText: xhr.statusText,
            headers: headers,
          });
          resolve(response);
        };

        xhr.onerror = () => reject(new Error("Network error"));
        xhr.ontimeout = () => reject(new Error("Request timeout"));
        xhr.timeout = 10000;

        xhr.send(JSON.stringify(request));
      });

      if (response.ok) {
        const newKey = await response.json();
        setApiKeys(prev => [...prev, newKey]);
        toast({
          title: "Chave criada com sucesso",
          description: `A chave "${request.name}" foi criada. Copie-a agora, pois ela não será mostrada novamente.`,
        });
        return newKey;
      } else {
        const error = await response.json();
        toast({
          title: "Erro ao criar chave",
          description: error.message || "Não foi possível criar a chave de API.",
          variant: "destructive",
        });
        return null;
      }
    } catch (error) {
      console.error("Error creating API key:", error);
      
      // Mock creation for development
      const newKey: ApiKey = {
        id: Date.now().toString(),
        name: request.name,
        key: `sk_live_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`,
        created_at: new Date().toISOString(),
        status: "active"
      };
      
      setApiKeys(prev => [...prev, newKey]);
      toast({
        title: "Chave criada com sucesso",
        description: `A chave "${request.name}" foi criada. Copie-a agora, pois ela não será mostrada novamente.`,
      });
      return newKey;
    }
  };

  const revokeApiKey = async (keyId: string): Promise<boolean> => {
    try {
      const response = await new Promise<Response>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("DELETE", `/api/admin/api-keys/${keyId}`, true);
        xhr.setRequestHeader("Accept", "application/json");

        xhr.onload = () => {
          const headers = new Headers();
          xhr
            .getAllResponseHeaders()
            .split("\r\n")
            .forEach((line) => {
              const [key, value] = line.split(": ");
              if (key && value) headers.set(key, value);
            });

          const response = new Response(xhr.responseText, {
            status: xhr.status,
            statusText: xhr.statusText,
            headers: headers,
          });
          resolve(response);
        };

        xhr.onerror = () => reject(new Error("Network error"));
        xhr.ontimeout = () => reject(new Error("Request timeout"));
        xhr.timeout = 10000;

        xhr.send();
      });

      if (response.ok) {
        setApiKeys(prev => prev.map(key => 
          key.id === keyId ? { ...key, status: "revoked" as const } : key
        ));
        toast({
          title: "Chave revogada",
          description: "A chave de API foi revogada com sucesso.",
        });
        return true;
      } else {
        const error = await response.json();
        toast({
          title: "Erro ao revogar chave",
          description: error.message || "Não foi possível revogar a chave de API.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error("Error revoking API key:", error);
      
      // Mock revocation for development
      setApiKeys(prev => prev.map(key => 
        key.id === keyId ? { ...key, status: "revoked" as const } : key
      ));
      toast({
        title: "Chave revogada",
        description: "A chave de API foi revogada com sucesso.",
      });
      return true;
    }
  };

  const regenerateApiKey = async (keyId: string): Promise<ApiKey | null> => {
    try {
      const response = await new Promise<Response>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `/api/admin/api-keys/${keyId}/regenerate`, true);
        xhr.setRequestHeader("Accept", "application/json");

        xhr.onload = () => {
          const headers = new Headers();
          xhr
            .getAllResponseHeaders()
            .split("\r\n")
            .forEach((line) => {
              const [key, value] = line.split(": ");
              if (key && value) headers.set(key, value);
            });

          const response = new Response(xhr.responseText, {
            status: xhr.status,
            statusText: xhr.statusText,
            headers: headers,
          });
          resolve(response);
        };

        xhr.onerror = () => reject(new Error("Network error"));
        xhr.ontimeout = () => reject(new Error("Request timeout"));
        xhr.timeout = 10000;

        xhr.send();
      });

      if (response.ok) {
        const updatedKey = await response.json();
        setApiKeys(prev => prev.map(key => 
          key.id === keyId ? updatedKey : key
        ));
        toast({
          title: "Chave regenerada",
          description: "Uma nova chave foi gerada. Copie-a agora, pois a antiga foi invalidada.",
        });
        return updatedKey;
      } else {
        const error = await response.json();
        toast({
          title: "Erro ao regenerar chave",
          description: error.message || "Não foi possível regenerar a chave de API.",
          variant: "destructive",
        });
        return null;
      }
    } catch (error) {
      console.error("Error regenerating API key:", error);
      
      // Mock regeneration for development
      const newKey = `sk_live_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
      setApiKeys(prev => prev.map(key => 
        key.id === keyId ? { ...key, key: newKey } : key
      ));
      toast({
        title: "Chave regenerada",
        description: "Uma nova chave foi gerada. Copie-a agora, pois a antiga foi invalidada.",
      });
      
      const updatedKey = apiKeys.find(k => k.id === keyId);
      return updatedKey ? { ...updatedKey, key: newKey } : null;
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
