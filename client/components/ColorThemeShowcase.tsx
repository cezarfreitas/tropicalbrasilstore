import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Palette, Sparkles, Heart } from 'lucide-react';

interface ThemeColors {
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  background_color?: string;
  text_color?: string;
}

export function ColorThemeShowcase() {
  const [colors, setColors] = useState<ThemeColors>({});
  const [hoveredColor, setHoveredColor] = useState<string | null>(null);

  useEffect(() => {
    // Get colors from CSS custom properties
    const root = document.documentElement;
    const style = getComputedStyle(root);
    
    setColors({
      primary_color: style.getPropertyValue('--color-primary') || '#f97316',
      secondary_color: style.getPropertyValue('--color-secondary') || '#ea580c',
      accent_color: style.getPropertyValue('--color-accent') || '#fed7aa',
      background_color: style.getPropertyValue('--color-background') || '#ffffff',
      text_color: style.getPropertyValue('--color-text') || '#1f2937',
    });
  }, []);

  const colorData = [
    {
      key: 'primary_color',
      name: 'Principal',
      description: 'Cor principal da loja',
      icon: Sparkles,
    },
    {
      key: 'secondary_color', 
      name: 'Secundária',
      description: 'Cor de apoio',
      icon: Heart,
    },
    {
      key: 'accent_color',
      name: 'Destaque',
      description: 'Cor de realce',
      icon: Palette,
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto mt-8" data-color-showcase>
      <Card className="border-primary/20 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-background to-accent/5">
        <CardContent className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Palette className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Paleta de Cores da Loja</h3>
            </div>
            <p className="text-sm text-muted-foreground">Cores personalizadas para uma experiência única</p>
          </div>

          {/* Color Showcase */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {colorData.map((colorInfo) => {
              const colorValue = colors[colorInfo.key as keyof ThemeColors] || '#999999';
              const Icon = colorInfo.icon;
              
              return (
                <div
                  key={colorInfo.key}
                  className="group relative"
                  onMouseEnter={() => setHoveredColor(colorInfo.key)}
                  onMouseLeave={() => setHoveredColor(null)}
                >
                  <div className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-all duration-200 hover:shadow-md">
                    {/* Color Circle */}
                    <div className="flex items-center gap-3 mb-3">
                      <div 
                        className="w-10 h-10 rounded-full border-2 border-white shadow-md transition-transform duration-200 group-hover:scale-110"
                        style={{ backgroundColor: colorValue }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm text-foreground">{colorInfo.name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{colorInfo.description}</p>
                      </div>
                    </div>
                    
                    {/* Color Code */}
                    <div className="text-center">
                      <Badge 
                        variant="outline" 
                        className="text-xs font-mono bg-muted/50 hover:bg-muted transition-colors cursor-default"
                      >
                        {colorValue}
                      </Badge>
                    </div>
                    
                    {/* Hover Effect */}
                    {hoveredColor === colorInfo.key && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent rounded-lg pointer-events-none" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Elements */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* Color Harmony Display */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Harmonia:</span>
              <div className="flex gap-1">
                {Object.values(colors).slice(0, 3).map((color, index) => (
                  <div
                    key={index}
                    className="w-3 h-3 rounded-full border border-white shadow-sm"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Theme Status */}
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              <Sparkles className="h-3 w-3 mr-1" />
              Tema Personalizado Ativo
            </Badge>
          </div>

          {/* Subtle Animation */}
          <div className="mt-4 flex justify-center">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 h-1 rounded-full bg-primary/30 animate-pulse"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
