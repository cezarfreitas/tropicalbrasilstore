import { useEffect, useState } from "react";

interface DynamicTitleProps {
  suffix?: string;
}

export function DynamicTitle({ suffix = "" }: DynamicTitleProps) {
  const [storeSettings, setStoreSettings] = useState<any>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // First try using the API directly
        let data = null;
        try {
          const response = await fetch("/api/settings");
          if (response.ok) {
            data = await response.json();
          }
        } catch (err) {
          console.warn("API call failed, using fallback settings");
        }

        // Use fallback if API failed
        if (!data) {
          data = {
            store_name: "Tropical Brasil B2B",
            primary_color: "#1d4ed8",
            secondary_color: "#64748b",
            accent_color: "#f59e0b",
          };
        }

        setStoreSettings(data);

        // Update title
        const storeName = data.store_name || "Chinelos Store";
        const fullTitle = suffix ? `${suffix} - ${storeName}` : storeName;
        document.title = fullTitle;

        console.log(`Dynamic title updated to: ${fullTitle}`);

      } catch (error) {
        console.error("Error in DynamicTitle:", error);
        // Final fallback
        const fallbackTitle = suffix ? `${suffix} - Tropical Brasil B2B` : "Tropical Brasil B2B";
        document.title = fallbackTitle;
      }
    };

    fetchSettings();
  }, [suffix]);

  return null; // This component doesn't render anything
}
