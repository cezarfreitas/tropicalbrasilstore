import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Palette, Sparkles } from 'lucide-react';

export function ThemeIndicator() {
  const [themeActive, setThemeActive] = useState(false);

  useEffect(() => {
    // Check if custom theme colors are active
    const checkThemeColors = () => {
      const root = document.documentElement;
      const primaryColor = root.style.getPropertyValue('--color-primary');
      setThemeActive(!!primaryColor);
    };

    checkThemeColors();
    
    // Set up a mutation observer to watch for theme changes
    const observer = new MutationObserver(checkThemeColors);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style']
    });

    return () => observer.disconnect();
  }, []);

  if (!themeActive) return null;

  return (
    <div className="hidden sm:flex items-center gap-2" />
  );
}
