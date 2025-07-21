import { ReactNode, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Package, User, LogOut, LogIn } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useCustomerAuth } from "@/hooks/use-customer-auth";
import { LoginModal } from "@/components/LoginModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface StoreLayoutProps {
  children: ReactNode;
}

export function StoreLayout({ children }: StoreLayoutProps) {
  const { items, totalItems } = useCart();

  return (
    <div className="min-h-screen bg-background">
            {/* Header */}
      <header className="border-b bg-card shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Link to="/loja" className="flex items-center gap-2 sm:gap-3">
              <div className="rounded-lg sm:rounded-xl bg-primary p-2 sm:p-3">
                <Package className="h-6 w-6 sm:h-8 sm:w-8 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg sm:text-2xl font-bold text-primary">
                  Chinelos
                </span>
                <span className="text-xs sm:text-sm text-muted-foreground">
                  Loja Online
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-2 sm:gap-4">
              <Link
                to="/admin"
                className="hidden sm:block text-sm text-muted-foreground hover:text-foreground"
              >
                Área Administrativa
              </Link>
              <Link to="/loja/carrinho">
                <Button variant="outline" size="sm" className="relative h-9 sm:h-10">
                  <ShoppingCart className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Carrinho</span>
                  {totalItems > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 h-4 w-4 sm:h-5 sm:w-5 rounded-full p-0 flex items-center justify-center text-xs"
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
      <main className="min-h-[calc(100vh-140px)] sm:min-h-[calc(100vh-160px)]">{children}</main>

            {/* Footer */}
      <footer className="border-t bg-card mt-8 sm:mt-16">
        <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
          <div className="text-center text-xs sm:text-sm text-muted-foreground">
            <p>&copy; 2024 Chinelos Store. Todos os direitos reservados.</p>
            <p className="mt-1 sm:mt-2">Sistema de vendas com grades obrigatórias</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
