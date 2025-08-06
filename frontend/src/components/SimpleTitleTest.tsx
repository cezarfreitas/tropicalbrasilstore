import { useEffect, useState } from "react";

export function SimpleTitleTest() {
  const [settings, setSettings] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        console.log("Fetching settings from direct API...");

        // Try multiple API endpoints
        const endpoints = [
          "/api/settings",
          "http://localhost:3000/api/settings",
        ];

        let data = null;
        let lastError = null;

        for (const endpoint of endpoints) {
          try {
            console.log(`Trying endpoint: ${endpoint}`);
            const response = await fetch(endpoint);

            if (!response.ok) {
              throw new Error(
                `HTTP ${response.status}: ${response.statusText}`,
              );
            }

            data = await response.json();
            console.log(`Settings received from ${endpoint}:`, data);
            break;
          } catch (err: any) {
            console.warn(`Failed to fetch from ${endpoint}:`, err.message);
            lastError = err;
          }
        }

        if (!data) {
          // Use fallback settings
          console.log("Using fallback settings");
          data = {
            store_name: "Tropical Brasil B2B",
            primary_color: "#1d4ed8",
            secondary_color: "#64748b",
            accent_color: "#f59e0b",
          };
        }

        setSettings(data);

        // Update title
        const storeName = data.store_name || "Chinelos Store";
        document.title = storeName;
        console.log(`Title updated to: ${storeName}`);
      } catch (err: any) {
        console.error("Error fetching settings:", err);
        setError(err.message);

        // Set fallback title
        document.title = "Tropical Brasil B2B";
      }
    };

    fetchSettings();
  }, []);

  return (
    <div
      style={{
        padding: "20px",
        fontFamily: "sans-serif",
        border: "2px solid #ccc",
        margin: "20px",
        borderRadius: "8px",
      }}
    >
      <h2>🔧 Teste de Título Dinâmico</h2>

      <div style={{ marginBottom: "15px" }}>
        <strong>Título atual da página:</strong>{" "}
        <span id="current-title">{document.title}</span>
      </div>

      {error && (
        <div style={{ color: "red", marginBottom: "15px" }}>
          <strong>❌ Erro:</strong> {error}
        </div>
      )}

      {settings ? (
        <div style={{ color: "green", marginBottom: "15px" }}>
          <strong>✅ Store Name carregado:</strong> {settings.store_name}
        </div>
      ) : (
        <div style={{ color: "orange", marginBottom: "15px" }}>
          <strong>⏳ Carregando configurações...</strong>
        </div>
      )}

      {settings && (
        <details style={{ marginTop: "15px" }}>
          <summary style={{ cursor: "pointer", fontWeight: "bold" }}>
            📋 Ver configurações completas
          </summary>
          <pre
            style={{
              background: "#f5f5f5",
              padding: "10px",
              borderRadius: "4px",
              fontSize: "12px",
              overflow: "auto",
            }}
          >
            {JSON.stringify(settings, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}
