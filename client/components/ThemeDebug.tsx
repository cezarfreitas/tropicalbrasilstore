import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";

interface ThemeDebugInfo {
  table_exists: boolean;
  columns: any[];
  settings: any;
  total_settings_count: number;
  error?: string;
}

export function ThemeDebug() {
  const [debugInfo, setDebugInfo] = useState<ThemeDebugInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchDebugInfo = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/debug-theme/settings");
      const data = await response.json();
      setDebugInfo(data);
    } catch (error) {
      console.error("Error fetching theme debug info:", error);
      setDebugInfo({
        error: "Failed to fetch debug info",
        table_exists: false,
        columns: [],
        settings: null,
        total_settings_count: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const createSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/debug-theme/create-settings", {
        method: "POST",
      });
      const data = await response.json();
      alert(JSON.stringify(data, null, 2));
      // Refresh debug info
      await fetchDebugInfo();
    } catch (error) {
      alert("Error creating settings: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const initializeSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/init-settings", {
        method: "POST",
      });
      const data = await response.json();
      alert(`Settings initialized: ${data.message}`);
      // Refresh debug info
      await fetchDebugInfo();
      // Refresh page to reload theme
      if (data.action === "created") {
        window.location.reload();
      }
    } catch (error) {
      alert("Error initializing settings: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const testSettingsEndpoint = async () => {
    try {
      const response = await fetch("/api/settings");
      const data = await response.json();
      alert("Settings endpoint response:\n" + JSON.stringify(data, null, 2));
    } catch (error) {
      alert("Settings endpoint error: " + error.message);
    }
  };

  useEffect(() => {
    fetchDebugInfo();
  }, []);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>🎨 Theme Debug</span>
          <div className="flex gap-2">
            <Button onClick={fetchDebugInfo} disabled={loading} size="sm">
              {loading ? "Loading..." : "Refresh"}
            </Button>
            <Button onClick={testSettingsEndpoint} size="sm" variant="outline">
              Test /api/settings
            </Button>
            <Button onClick={initializeSettings} size="sm" variant="default">
              Initialize Settings
            </Button>
            <Button onClick={createSettings} size="sm" variant="secondary">
              Create Settings
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {debugInfo ? (
          <div className="space-y-4">
            {debugInfo.error ? (
              <div className="text-red-600">Error: {debugInfo.error}</div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <strong>Table Exists:</strong>{" "}
                    {debugInfo.table_exists ? "Yes" : "No"}
                  </div>
                  <div>
                    <strong>Settings Count:</strong>{" "}
                    {debugInfo.total_settings_count}
                  </div>
                </div>

                {debugInfo.settings && (
                  <div>
                    <strong>Current Settings:</strong>
                    <pre className="mt-2 p-3 bg-gray-50 rounded text-sm overflow-auto max-h-40">
                      {JSON.stringify(debugInfo.settings, null, 2)}
                    </pre>
                  </div>
                )}

                <div>
                  <strong>Table Columns:</strong>
                  <div className="mt-2 text-sm">
                    {debugInfo.columns.map((col, index) => (
                      <div key={index} className="p-1 bg-gray-50 rounded mb-1">
                        <strong>{col.COLUMN_NAME}</strong> - Default:{" "}
                        {col.COLUMN_DEFAULT || "NULL"} - Nullable:{" "}
                        {col.IS_NULLABLE}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div>Loading theme debug info...</div>
        )}
      </CardContent>
    </Card>
  );
}
