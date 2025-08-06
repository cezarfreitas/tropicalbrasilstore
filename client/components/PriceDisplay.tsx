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
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-1.5 text-gray-500">
            <Lock className="h-3.5 w-3.5" />
            <span className="text-xs">Faça login para ver preços</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs px-3 text-primary border-primary/30 hover:bg-primary/5"
            onClick={onLoginClick}
          >
            Entrar
          </Button>
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
