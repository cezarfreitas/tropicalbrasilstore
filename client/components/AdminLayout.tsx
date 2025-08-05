import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useGlobalStoreSettings } from "@/hooks/use-global-store-settings";
import { DynamicTitle } from "@/components/DynamicTitle";
import {
  Package,
  Palette,
  Ruler,
  Grid3x3,
  ShoppingBag,
  Settings,
  Menu,
  X,
  ShoppingCart,
  Users,
  Bell,
  LogOut,
  Upload,
  Tags,
  Code,
  UserCheck,
} from "lucide-react";
import { useState } from "react";

interface AdminLayoutProps {
  children: ReactNode;
}

const navigation = [
  {
    name: "Pedidos",
    href: "/admin/orders",
    icon: ShoppingCart,
  },
  {
    name: "Clientes",
    href: "/admin/customers",
    icon: Users,
  },
  {
    name: "Vendedores",
    href: "/admin/vendors",
    icon: UserCheck,
  },
  {
    name: "Produtos V2",
    href: "/admin/products-v2",
    icon: Package,
  },
  {
    name: "Importar Produtos",
    href: "/admin/products/import",
    icon: Upload,
  },
  {
    name: "Categorias",
    href: "/admin/categories",
    icon: ShoppingBag,
  },
  {
    name: "Tamanhos",
    href: "/admin/sizes",
    icon: Ruler,
  },
  {
    name: "Cores",
    href: "/admin/colors",
    icon: Palette,
  },
  {
    name: "Atributos",
    href: "/admin/attributes",
    icon: Tags,
  },
  {
    name: "Grade Vendida",
    href: "/admin/grades",
    icon: Grid3x3,
  },
  {
    name: "Notificações",
    href: "/admin/notifications",
    icon: Bell,
  },
  {
    name: "Configurações",
    href: "/admin/settings",
    icon: Settings,
  },
  {
    name: "API",
    href: "/admin/api",
    icon: Code,
  },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { logout } = useAuth();
  const { toast } = useToast();
  const storeSettings = useGlobalStoreSettings();

  const handleLogout = () => {
    logout();
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile menu */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          mobileMenuOpen ? "block" : "hidden",
        )}
      >
        <div className="fixed inset-0 bg-black/20" aria-hidden="true" />
        <div className="fixed inset-y-0 left-0 z-50 w-64 bg-card p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary p-2">
                <Package className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-primary">
                {storeSettings?.store_name || "Chinelos"} Admin
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <nav className="mt-8 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
            <div className="mt-8 pt-4 border-t">
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full justify-start gap-3 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-56 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-card px-6 py-8 shadow-sm">
          <Link to="/admin" className="flex h-16 shrink-0 items-center gap-2">
            <div className="rounded-xl bg-primary p-3">
              <Package className="h-8 w-8 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-primary">
                {storeSettings?.store_name || "Chinelos"}
              </span>
              <span className="text-sm text-muted-foreground">Admin Panel</span>
            </div>
          </Link>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.href;
                    return (
                      <li key={item.name}>
                        <Link
                          to={item.href}
                          className={cn(
                            "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors",
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                          )}
                        >
                          <Icon className="h-6 w-6 shrink-0" />
                          {item.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
              <li className="mt-auto">
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="w-full justify-start gap-x-3 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  <LogOut className="h-6 w-6 shrink-0" />
                  Sair
                </Button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-56">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b bg-card px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-muted-foreground">
                  Sistema Online
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
