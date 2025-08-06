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
      console.log(`🎨 Fetching theme colors from server... (attempts left: ${retries + 1})`);

      // Use simple fetch with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch("/api/settings", {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const settings = await response.json();
        const themeColors = {
          primary_color: settings.primary_color || "#3b82f6",
          secondary_color: settings.secondary_color || "#1d4ed8",
          accent_color: settings.accent_color || "#dbeafe",
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
      console.warn(`Error fetching theme colors (attempt ${2 - retries}):`, error.message || error);

      // Retry once if we have attempts left
      if (retries > 0 && !error.name?.includes('AbortError')) {
        setTimeout(() => fetchThemeColors(retries - 1), 1000);
        return;
      }

      // Final fallback after all retries
      console.error("Theme color fetch failed, using blue theme fallback colors");

      // Use blue theme fallback colors
      const fallbackColors = {
        primary_color: "#3b82f6",
        secondary_color: "#1d4ed8",
        accent_color: "#dbeafe",
        background_color: "#ffffff",
        text_color: "#1f2937"
      };
      console.log("🎨 Using blue theme fallback colors:", fallbackColors);
      setColors(fallbackColors);
    } finally {
      setLoading(false);
    }
  };

  // This component doesn't render anything visible
  return null;
}
