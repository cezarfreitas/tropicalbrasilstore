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
    <div className="hidden sm:flex items-center gap-2">
      <Badge 
        variant="outline" 
        className="bg-primary/5 text-primary border-primary/20 text-xs px-2 py-1 animate-pulse"
      >
        <Palette className="h-3 w-3 mr-1" />
        Tema Personalizado
      </Badge>
      <div className="flex gap-1">
        <div className="w-2 h-2 rounded-full bg-primary" />
        <div className="w-2 h-2 rounded-full bg-secondary" />
        <div className="w-2 h-2 rounded-full bg-accent" />
      </div>
    </div>
  );
}
