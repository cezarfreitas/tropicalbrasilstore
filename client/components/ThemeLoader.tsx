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

  const fetchThemeColors = async (retries = 1) => {
    try {
      console.log(
        `🎨 Fetching theme colors from server... (attempts left: ${retries + 1})`,
      );

      // Use XMLHttpRequest to bypass FullStory interference
      const response = await new Promise<Response>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", "/api/settings", true);
        xhr.setRequestHeader("Accept", "application/json");
        xhr.setRequestHeader("Content-Type", "application/json");

        xhr.onload = () => {
          try {
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
          } catch (parseError) {
            reject(new Error(`Response parsing error: ${parseError.message}`));
          }
        };

        xhr.onerror = () => reject(new Error("Network error"));
        xhr.ontimeout = () => reject(new Error("Request timeout"));
        xhr.timeout = 5000; // 5 second timeout

        xhr.send();
      });

      if (response.ok) {
        const settings = await response.json();
        const themeColors = {
          primary_color: settings.primary_color || "#3b82f6",
          secondary_color: settings.secondary_color || "#1d4ed8",
          accent_color: settings.accent_color || "#dbeafe",
          background_color: settings.background_color || "#ffffff",
          text_color: settings.text_color || "#1f2937",
        };
        console.log("🎨 Theme colors loaded successfully:", themeColors);
        setColors(themeColors);

        // Save to localStorage for faster loading next time
        localStorage.setItem("theme-colors", JSON.stringify(themeColors));
        return; // Success, no retry needed
      } else if (response.status === 404 || response.status === 500) {
        // Try to initialize settings if they don't exist
        console.log("🎨 Settings not found, attempting to initialize...");
        await initializeSettings();
        return;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.warn(
        `Theme colors fetch attempt ${2 - retries} failed:`,
        error.message || error,
      );

      // Retry once if we have attempts left
      if (retries > 0) {
        setTimeout(() => fetchThemeColors(retries - 1), 1000);
        return;
      }

      // Use fallback colors
      useFallbackColors();
    } finally {
      setLoading(false);
    }
  };

  const initializeSettings = async () => {
    try {
      console.log("🎨 Initializing default store settings...");

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/init-settings", false); // Synchronous for simplicity
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.send();

      if (xhr.status === 200) {
        console.log("🎨 Settings initialized, retrying theme fetch...");
        // Retry fetching after initialization
        setTimeout(() => fetchThemeColors(0), 500);
      } else {
        console.warn("🎨 Failed to initialize settings");
        useFallbackColors();
      }
    } catch (error) {
      console.warn("🎨 Error initializing settings:", error);
      useFallbackColors();
    }
  };

  const useFallbackColors = () => {
    console.log("🎨 Using blue theme fallback colors");
    const fallbackColors = {
      primary_color: "#3b82f6",
      secondary_color: "#1d4ed8",
      accent_color: "#dbeafe",
      background_color: "#ffffff",
      text_color: "#1f2937",
    };
    setColors(fallbackColors);
    // Save fallback to localStorage
    localStorage.setItem("theme-colors", JSON.stringify(fallbackColors));
  };

  // This component doesn't render anything visible
  return null;
}
