import { useEffect, useState } from "react";
import {
  useThemeColors,
  loadStoredThemeColors,
} from "@/hooks/use-theme-colors";

interface ThemeColors {
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  background_color?: string;
  text_color?: string;
}

export function ThemeLoader() {
  const [colors, setColors] = useState<ThemeColors | null>(null);
  const [loading, setLoading] = useState(true);

  // Apply colors when they change
  useThemeColors(colors || {});

  useEffect(() => {
    // Load stored colors immediately
    const storedColors = loadStoredThemeColors();
    if (storedColors) {
      setColors(storedColors);
    }

    // Fetch fresh colors from server
    fetchThemeColors();

    // Listen for theme refresh events (when settings are updated)
    const handleThemeRefresh = () => {
      console.log("🎨 Theme refresh requested, fetching new colors...");
      fetchThemeColors();
    };

    window.addEventListener("themeRefresh", handleThemeRefresh);

    return () => {
      window.removeEventListener("themeRefresh", handleThemeRefresh);
    };
  }, []);

  const fetchThemeColors = async () => {
    try {
      console.log("🎨 Fetching theme colors from server...");

      // Use XMLHttpRequest to avoid FullStory conflicts
      const response = await new Promise<Response>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", "/api/settings", true);
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
        xhr.timeout = 8000; // 8 second timeout

        xhr.send();
      });

      if (response.ok) {
        const settings = await response.json();
        const themeColors = {
          primary_color: settings.primary_color,
          secondary_color: settings.secondary_color,
          accent_color: settings.accent_color,
          background_color: settings.background_color,
          text_color: settings.text_color,
        };
        console.log("🎨 Received theme colors from server:", themeColors);
        setColors(themeColors);
      } else {
        console.error("Failed to fetch theme colors, status:", response.status);
      }
    } catch (error) {
      console.error("Error fetching theme colors:", error);
    } finally {
      setLoading(false);
    }
  };

  // This component doesn't render anything visible
  return null;
}
