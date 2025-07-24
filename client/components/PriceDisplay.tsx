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
      <div className={`space-y-1 ${className}`}>
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground font-medium">
            Faça login para ver preços
          </span>
        </div>
        <Link to="/login">
          <Button
            variant="outline"
            size="sm"
            className="h-6 text-xs px-2 border-primary/20 text-primary hover:bg-primary/5"
          >
            Entrar
          </Button>
        </Link>
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
