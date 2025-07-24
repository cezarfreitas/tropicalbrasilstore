import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Sparkles, Palette, Heart, Gift, Star } from "lucide-react";

export function PromoBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="relative bg-gradient-to-r from-primary via-secondary to-primary text-primary-foreground py-3 px-4 shadow-md">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSI0Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>

      <div className="relative container mx-auto flex items-center justify-between">
        {/* Content */}
        <div className="flex items-center gap-4 flex-1">
          {/* Icon */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="p-2 bg-white/20 rounded-full">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="h-6 w-px bg-white/30"></div>
          </div>

          {/* Message */}
          <div className="flex items-center gap-3 flex-1">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 sm:hidden" />
              <span className="font-medium text-sm sm:text-base">
                🎨 Nova experiência com cores personalizadas!
              </span>
            </div>

            {/* Features badges */}
            <div className="hidden md:flex items-center gap-2 ml-4">
              <Badge
                variant="secondary"
                className="bg-white/20 text-white border-white/30 text-xs"
              >
                <Heart className="h-3 w-3 mr-1" />
                Temas únicos
              </Badge>
              <Badge
                variant="secondary"
                className="bg-white/20 text-white border-white/30 text-xs"
              >
                <Star className="h-3 w-3 mr-1" />
                Visual moderno
              </Badge>
            </div>
          </div>

          {/* CTA */}
          <div className="hidden sm:flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="bg-white text-primary hover:bg-white/90 text-sm font-medium px-4"
              onClick={() => {
                const showcaseElement = document.querySelector(
                  "[data-color-showcase]",
                );
                if (showcaseElement) {
                  showcaseElement.scrollIntoView({ behavior: "smooth" });
                } else {
                  // Trigger the floating button to show showcase
                  const event = new CustomEvent("toggleColorShowcase");
                  window.dispatchEvent(event);
                }
              }}
            >
              <Gift className="h-3 w-3 mr-1" />
              Ver Cores
            </Button>
          </div>
        </div>

        {/* Close button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsVisible(false)}
          className="h-8 w-8 p-0 text-white hover:bg-white/20 ml-2"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
