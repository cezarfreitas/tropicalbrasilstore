import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Palette, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Settings,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface FloatingColorButtonProps {
  onToggleShowcase?: () => void;
  showcaseVisible?: boolean;
}

export function FloatingColorButton({ 
  onToggleShowcase, 
  showcaseVisible = false 
}: FloatingColorButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const colorActions = [
    {
      id: 'toggle-showcase',
      label: showcaseVisible ? 'Ocultar Cores' : 'Mostrar Cores',
      icon: showcaseVisible ? EyeOff : Eye,
      onClick: onToggleShowcase,
      color: 'primary'
    },
    {
      id: 'admin-colors',
      label: 'Configurar Cores',
      icon: Settings,
      onClick: () => window.open('/admin/settings', '_blank'),
      color: 'secondary'
    }
  ];

  return (
    <div className="fixed bottom-4 right-4 z-30">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg hover:shadow-xl transition-all duration-300 border border-primary/20 group"
          >
            <div className="relative">
              <Palette className="h-5 w-5 text-primary-foreground group-hover:scale-110 transition-transform duration-200" />
              {/* Animated dots */}
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full animate-pulse" />
            </div>
          </Button>
        </PopoverTrigger>
        
        <PopoverContent 
          side="top" 
          align="end" 
          className="w-64 p-4 bg-card/95 backdrop-blur-sm border-primary/20 shadow-xl"
        >
          {/* Header */}
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm text-foreground">Cores da Loja</span>
            <Badge variant="outline" className="ml-auto text-xs bg-primary/10 text-primary">
              Ativo
            </Badge>
          </div>

          {/* Quick Color Preview */}
          <div className="flex items-center gap-2 mb-4 p-2 bg-muted/30 rounded-lg">
            <span className="text-xs text-muted-foreground">Paleta atual:</span>
            <div className="flex gap-1 ml-auto">
              <div className="w-3 h-3 rounded-full bg-primary border border-white shadow-sm" />
              <div className="w-3 h-3 rounded-full bg-secondary border border-white shadow-sm" />
              <div className="w-3 h-3 rounded-full bg-accent border border-white shadow-sm" />
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            {colorActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    action.onClick?.();
                    setIsOpen(false);
                  }}
                  className="w-full justify-start gap-3 h-9 hover:bg-primary/5 hover:text-primary transition-all duration-200"
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm">{action.label}</span>
                  {action.id === 'toggle-showcase' && (
                    <div className="ml-auto">
                      {showcaseVisible ? (
                        <ChevronUp className="h-3 w-3 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                  )}
                </Button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-4 pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              Personalize as cores no painel admin
            </p>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
