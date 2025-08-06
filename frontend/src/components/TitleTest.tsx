import { useEffect } from "react";
import { useGlobalStoreSettings } from "@/hooks/use-global-store-settings";

export function TitleTest() {
  const storeSettings = useGlobalStoreSettings();

  useEffect(() => {
    console.log("Store settings loaded:", storeSettings);
  }, [storeSettings]);

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Frontend Separado - Teste de Título</h1>
      <p>
        <strong>Título atual da página:</strong> {document.title}
      </p>
      <p>
        <strong>Store Name da API:</strong>{" "}
        {storeSettings?.store_name || "Carregando..."}
      </p>
      <p>
        <strong>Status:</strong>{" "}
        {storeSettings
          ? "✅ Configurações carregadas"
          : "⏳ Carregando configurações..."}
      </p>

      <div
        style={{
          marginTop: "20px",
          padding: "10px",
          background: "#f0f0f0",
          borderRadius: "5px",
        }}
      >
        <h3>Debug Info:</h3>
        <pre>{JSON.stringify(storeSettings, null, 2)}</pre>
      </div>
    </div>
  );
}
