import { useEffect } from 'react';

interface ThemeColors {
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  background_color?: string;
  text_color?: string;
}

export function useThemeColors(colors: ThemeColors) {
  useEffect(() => {
    if (!colors) return;

    console.log('🎨 Applying theme colors:', colors);
    const root = document.documentElement;

    // Apply colors as CSS custom properties
    if (colors.primary_color) {
      // Convert hex to HSL for better integration with existing Tailwind
      const hsl = hexToHsl(colors.primary_color);
      root.style.setProperty('--primary', hsl);
      root.style.setProperty('--color-primary', colors.primary_color);
    }

    if (colors.secondary_color) {
      const hsl = hexToHsl(colors.secondary_color);
      root.style.setProperty('--secondary', hsl);
      root.style.setProperty('--color-secondary', colors.secondary_color);
    }

    if (colors.accent_color) {
      const hsl = hexToHsl(colors.accent_color);
      root.style.setProperty('--accent', hsl);
      root.style.setProperty('--color-accent', colors.accent_color);
    }

    if (colors.background_color) {
      const hsl = hexToHsl(colors.background_color);
      root.style.setProperty('--background', hsl);
      root.style.setProperty('--color-background', colors.background_color);
    }

    if (colors.text_color) {
      const hsl = hexToHsl(colors.text_color);
      root.style.setProperty('--foreground', hsl);
      root.style.setProperty('--color-text', colors.text_color);
    }

    // Store in localStorage for persistence
    localStorage.setItem('theme-colors', JSON.stringify(colors));

  }, [colors]);
}

// Helper function to convert hex to HSL
function hexToHsl(hex: string): string {
  // Remove hash if present
  hex = hex.replace('#', '');
  
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
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
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
    const stored = localStorage.getItem('theme-colors');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error loading stored theme colors:', error);
    return null;
  }
}
