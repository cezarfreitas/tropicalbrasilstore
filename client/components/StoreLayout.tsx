import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Package } from "lucide-react";
import { useCart } from "@/hooks/use-cart";

interface StoreLayoutProps {
  children: ReactNode;
}

export function StoreLayout({ children }: StoreLayoutProps) {
  const { items, totalItems } = useCart();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/loja" className="flex items-center gap-2">
              <div className="rounded-xl bg-primary p-3">
                <Package className="h-8 w-8 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-primary">
                  Chinelos
                </span>
                <span className="text-sm text-muted-foreground">
                  Loja Online
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-4">
              <Link
                to="/admin"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Área Administrativa
              </Link>
              <Link to="/loja/carrinho">
                <Button variant="outline" size="sm" className="relative">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Carrinho
                  {totalItems > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                    >
                      {totalItems}
                    </Badge>
                  )}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="border-t bg-card mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>&copy; 2024 Chinelos Store. Todos os direitos reservados.</p>
            <p className="mt-2">Sistema de vendas com grades obrigatórias</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
