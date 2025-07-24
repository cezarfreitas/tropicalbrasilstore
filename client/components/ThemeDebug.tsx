import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Eye, Info } from 'lucide-react';

export function ThemeDebug() {
  const [cssColors, setCssColors] = useState<Record<string, string>>({});
  const [localStorageColors, setLocalStorageColors] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  const refreshDebugInfo = () => {
    // Get CSS custom properties
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    
    const colors = {
      'primary': root.style.getPropertyValue('--color-primary') || 'Not set',
      'secondary': root.style.getPropertyValue('--color-secondary') || 'Not set',
      'accent': root.style.getPropertyValue('--color-accent') || 'Not set',
      'background': root.style.getPropertyValue('--color-background') || 'Not set',
      'text': root.style.getPropertyValue('--color-text') || 'Not set',
      'primary-hsl': computedStyle.getPropertyValue('--primary').trim() || 'Not set',
      'secondary-hsl': computedStyle.getPropertyValue('--secondary').trim() || 'Not set',
      'accent-hsl': computedStyle.getPropertyValue('--accent').trim() || 'Not set',
    };
    
    setCssColors(colors);

    // Get localStorage colors
    try {
      const stored = localStorage.getItem('theme-colors');
      setLocalStorageColors(stored ? JSON.parse(stored) : null);
    } catch (error) {
      setLocalStorageColors({ error: 'Failed to parse stored colors' });
    }
  };

  useEffect(() => {
    refreshDebugInfo();
    
    // Refresh when theme changes
    const handleThemeRefresh = refreshDebugInfo;
    window.addEventListener('themeRefresh', handleThemeRefresh);
    
    return () => {
      window.removeEventListener('themeRefresh', handleThemeRefresh);
    };
  }, []);

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 left-4 z-30">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsVisible(true)}
          className="bg-background/95 backdrop-blur-sm"
        >
          <Info className="h-4 w-4 mr-2" />
          Debug Tema
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-30 max-w-md">
      <Card className="bg-background/95 backdrop-blur-sm shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Debug do Tema</CardTitle>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshDebugInfo}
                className="h-6 w-6 p-0"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
                className="h-6 w-6 p-0"
              >
                <Eye className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          {/* CSS Colors */}
          <div>
            <Badge variant="outline" className="mb-2">CSS Vars</Badge>
            <div className="space-y-1">
              {Object.entries(cssColors).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="font-mono text-muted-foreground">{key}:</span>
                  <span className={`font-mono ${value === 'Not set' ? 'text-red-500' : 'text-green-600'}`}>
                    {value === 'Not set' ? 'Not set' : value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* LocalStorage */}
          <div>
            <Badge variant="outline" className="mb-2">localStorage</Badge>
            {localStorageColors ? (
              <div className="space-y-1">
                {localStorageColors.error ? (
                  <div className="text-red-500">{localStorageColors.error}</div>
                ) : (
                  Object.entries(localStorageColors).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="font-mono text-muted-foreground">{key}:</span>
                      <span className="font-mono text-green-600">{value as string}</span>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="text-red-500">No stored colors</div>
            )}
          </div>

          {/* Status */}
          <div>
            <Badge variant="outline" className="mb-2">Status</Badge>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>ThemeLoader:</span>
                <Badge variant={cssColors.primary !== 'Not set' ? 'default' : 'destructive'} className="text-xs">
                  {cssColors.primary !== 'Not set' ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
