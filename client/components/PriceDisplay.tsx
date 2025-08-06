import { Lock } from "lucide-react";
import { useCustomerAuth } from "@/hooks/use-customer-auth";
import { Button } from "@/components/ui/button";

interface PriceDisplayProps {
  price: number;
  className?: string;
  variant?: "default" | "large" | "small";
  showCurrency?: boolean;
  suggestedPrice?: number;
  onLoginClick?: () => void;
}

export function PriceDisplay({
  price,
  className = "",
  variant = "default",
  showCurrency = true,
  suggestedPrice,
  onLoginClick,
}: PriceDisplayProps) {
  const { isAuthenticated, isApproved } = useCustomerAuth();

  // Show price only if user is authenticated and approved
  const shouldShowPrice = isAuthenticated && isApproved;

  if (!shouldShowPrice) {
    return (
      <div className={`${className}`}>
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-3 text-white shadow-md">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="h-4 w-4" />
              <span className="text-xs font-medium opacity-90">
                Acesso Exclusivo
              </span>
            </div>
            <p className="text-sm font-semibold mb-3">
              Entre para ver preços especiais
            </p>
            <Button
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm h-7 text-xs px-3 font-medium transition-all duration-200 hover:scale-105"
              onClick={onLoginClick}
            >
              Entrar agora
            </Button>
          </div>

          {/* Decorative elements */}
          <div className="absolute -top-2 -right-2 w-12 h-12 bg-white/10 rounded-full blur-sm"></div>
          <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/5 rounded-full blur-md"></div>
        </div>
      </div>
    );
  }

  const formatPrice = (value: number) => {
    return showCurrency
      ? `R$ ${parseFloat(value.toString()).toFixed(2)}`
      : parseFloat(value.toString()).toFixed(2);
  };

  const sizeClasses = {
    small: "text-xs",
    default: "text-sm sm:text-lg",
    large: "text-lg sm:text-xl",
  };

  return (
    <div className={`space-y-1 ${className}`}>
      <div className={`font-bold text-primary ${sizeClasses[variant]}`}>
        {formatPrice(price)}
      </div>
      {suggestedPrice && (
        <div className="text-xs text-muted-foreground">
          Sugerido: {formatPrice(suggestedPrice)}
        </div>
      )}
    </div>
  );
}
