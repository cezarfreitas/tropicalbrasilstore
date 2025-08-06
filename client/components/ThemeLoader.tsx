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

  const fetchThemeColors = async (retries = 2) => {
    try {
      console.log(`🎨 Fetching theme colors from server... (attempts left: ${retries + 1})`);

      // Use XMLHttpRequest to avoid FullStory conflicts
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
        xhr.timeout = 12000; // Increased to 12 second timeout

        xhr.send();
      });

      if (response.ok) {
        const settings = await response.json();
        const themeColors = {
          primary_color: settings.primary_color || "#f97316",
          secondary_color: settings.secondary_color || "#ea580c",
          accent_color: settings.accent_color || "#fed7aa",
          background_color: settings.background_color || "#ffffff",
          text_color: settings.text_color || "#1f2937",
        };
        console.log("🎨 Received theme colors from server:", themeColors);
        setColors(themeColors);

        // Save to localStorage for faster loading next time
        localStorage.setItem("theme-colors", JSON.stringify(themeColors));
        return; // Success, no retry needed
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.warn(`Error fetching theme colors (attempt ${3 - retries}):`, error.message || error);

      // Retry if we have attempts left and it's a network-related error
      if (retries > 0 && (
        error.message.includes('timeout') ||
        error.message.includes('Network') ||
        error.message.includes('fetch') ||
        error.message.includes('HTTP 5')
      )) {
        setTimeout(() => fetchThemeColors(retries - 1), 2000);
        return;
      }

      // Final fallback after all retries
      console.error("All theme color fetch attempts failed, using fallback colors");

      // Use fallback colors if there's any error
      const fallbackColors = {
        primary_color: "#f97316",
        secondary_color: "#ea580c",
        accent_color: "#fed7aa",
        background_color: "#ffffff",
        text_color: "#1f2937"
      };
      console.log("🎨 Using fallback colors due to error:", fallbackColors);
      setColors(fallbackColors);
    } finally {
      setLoading(false);
    }
  };

  // This component doesn't render anything visible
  return null;
}
