import { useEffect } from "react";

interface ThemeColors {
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  background_color?: string;
  text_color?: string;
}

export function useThemeColors(colors: ThemeColors) {
  // Hook desabilitado - as cores são agora fixas em azul no CSS global
  useEffect(() => {
    console.log("🎨 Theme colors fixas em azul - hook desabilitado");
  }, [colors]);
}

// Helper function to convert hex to HSL
function hexToHsl(hex: string): string {
  // Remove hash if present
  hex = hex.replace("#", "");

  // Parse r, g, b values
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  // Convert to percentages
  const hPercent = Math.round(h * 360);
  const sPercent = Math.round(s * 100);
  const lPercent = Math.round(l * 100);

  return `${hPercent} ${sPercent}% ${lPercent}%`;
}

// Load theme colors from localStorage on app start
export function loadStoredThemeColors(): ThemeColors | null {
  try {
    const stored = localStorage.getItem("theme-colors");
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error("Error loading stored theme colors:", error);
    return null;
  }
}
