import { ReactNode, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Package, User, LogOut, LogIn, Menu, X } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useCustomerAuth } from "@/hooks/use-customer-auth";
import { LoginModal } from "@/components/LoginModal";
import { RegisterModal } from "@/components/RegisterModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Category {
  id: string;
  name: string;
}

interface StoreLayoutProps {
  children: ReactNode;
}

export function StoreLayout({ children }: StoreLayoutProps) {
  const { items, totalItems } = useCart();
  const { isAuthenticated, isApproved, customer, logout } = useCustomerAuth();
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  // Fetch categories for mobile menu
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await new Promise<Response>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('GET', '/api/store/categories', true);
          xhr.setRequestHeader('Accept', 'application/json');

          xhr.onload = () => {
            const headers = new Headers();
            xhr.getAllResponseHeaders().split('\r\n').forEach(line => {
              const [key, value] = line.split(': ');
              if (key && value) headers.set(key, value);
            });

            const response = new Response(xhr.responseText, {
              status: xhr.status,
              statusText: xhr.statusText,
              headers: headers
            });
            resolve(response);
          };

          xhr.onerror = () => reject(new Error('Network error'));
          xhr.ontimeout = () => reject(new Error('Request timeout'));
          xhr.timeout = 5000;

          xhr.send();
        });

        if (response.ok) {
          const data = await response.json();
          setCategories([
            { id: 'all', name: 'Todas as Categorias' },
            ...data
          ]);
        }
      } catch (error) {
        console.warn('Failed to fetch categories:', error);
        // Set default categories
        setCategories([
          { id: 'all', name: 'Todas as Categorias' },
          { id: '1', name: 'Chinelos' },
          { id: '2', name: 'Sandálias' },
          { id: '3', name: 'Tênis' },
        ]);
      }
    };

    fetchCategories();
  }, []);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (categoriesOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [categoriesOpen]);

  return (
    <div className="min-h-screen bg-background">
            {/* Header */}
      <header className="border-b bg-card shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          {/* Mobile Layout - Centered Logo */}
          <div className="flex sm:hidden items-center justify-center relative">
            {/* Mobile Hamburger Menu */}
            <div className="absolute left-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCategoriesOpen(true)}
                className="h-9 w-9 p-0"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>

            <Link to="/loja" className="flex items-center gap-2">
              <div className="rounded-lg bg-primary p-2">
                <Package className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-primary">
                  Chinelos
                </span>
                <span className="text-xs text-muted-foreground">
                  Loja Online
                </span>
              </div>
            </Link>

            {/* Mobile Cart - Absolute positioned */}
            <div className="absolute right-0 flex items-center gap-2">
              {/* Authentication Status */}
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-9">
                      <User className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {customer?.name || "Cliente"}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {customer?.whatsapp}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-xs">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            isApproved ? "bg-green-500" : "bg-yellow-500"
                          }`}
                        />
                        {isApproved ? "Conta aprovada" : "Aguardando aprovação"}
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9"
                  onClick={() => setLoginModalOpen(true)}
                >
                  <LogIn className="h-4 w-4" />
                </Button>
              )}

              {/* Cart */}
              <Link to="/loja/carrinho">
                <Button variant="outline" size="sm" className="relative h-9">
                  <ShoppingCart className="h-4 w-4" />
                  {totalItems > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs"
                    >
                      {totalItems}
                    </Badge>
                  )}
                </Button>
              </Link>
            </div>
          </div>

          {/* Desktop Layout - Logo left, Collections center, Actions right */}
          <div className="hidden sm:flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link to="/loja" className="flex items-center gap-3">
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

              {/* Collections Navigation */}
              <nav className="flex items-center gap-4 ml-8">
                <Link
                  to="/loja"
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  Todos
                </Link>
                <Link
                  to="/loja?categoria=havaianas"
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  Havaianas
                </Link>
                <Link
                  to="/loja?categoria=adidas"
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  Adidas
                </Link>
                <Link
                  to="/loja?categoria=nike"
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  Nike
                </Link>
                <Link
                  to="/loja?categoria=feminino"
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  Feminino
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-3">
              {/* Authentication Status */}
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-10">
                      <User className="h-4 w-4 mr-2" />
                      <span>
                        {customer?.name || "Cliente"}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {customer?.name || "Cliente"}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {customer?.whatsapp}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-xs">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            isApproved ? "bg-green-500" : "bg-yellow-500"
                          }`}
                        />
                        {isApproved ? "Conta aprovada" : "Aguardando aprovação"}
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10"
                  onClick={() => setLoginModalOpen(true)}
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  <span>Entrar</span>
                </Button>
              )}

              {/* Cart */}
              <Link to="/loja/carrinho">
                <Button variant="outline" size="sm" className="relative h-10">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  <span>Carrinho</span>
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

              {/* Admin Link */}
              <Link
                to="/admin"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Admin
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

            {/* Login Modal */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSwitchToRegister={() => {
          setLoginModalOpen(false);
          setRegisterModalOpen(true);
        }}
        onSuccess={() => {
          // Optionally refresh the page or update state
          window.location.reload();
        }}
      />

      {/* Register Modal */}
      <RegisterModal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        onSwitchToLogin={() => {
          setRegisterModalOpen(false);
          setLoginModalOpen(true);
        }}
      />

      {/* Mobile Categories Drawer */}
      {categoriesOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-50 sm:hidden"
            onClick={() => setCategoriesOpen(false)}
          />

          {/* Drawer */}
          <div className="fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white z-50 transform transition-transform duration-300 sm:hidden">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Categorias</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCategoriesOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Categories List */}
            <div className="p-4">
              <div className="space-y-2">
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    to={category.id === 'all' ? '/loja' : `/loja?categoria=${category.name.toLowerCase()}`}
                    onClick={() => setCategoriesOpen(false)}
                    className="block w-full p-3 text-left rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <span className="font-medium">{category.name}</span>
                  </Link>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-sm font-medium text-gray-600 mb-3">Ações Rápidas</h3>
                <div className="space-y-2">
                  <Link
                    to="/loja/carrinho"
                    onClick={() => setCategoriesOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <ShoppingCart className="h-4 w-4 text-gray-600" />
                    <span className="font-medium">Carrinho</span>
                    {totalItems > 0 && (
                      <Badge variant="secondary" className="ml-auto">
                        {totalItems}
                      </Badge>
                    )}
                  </Link>

                  {isAuthenticated ? (
                    <button
                      onClick={() => {
                        setCategoriesOpen(false);
                        logout();
                      }}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors w-full text-left"
                    >
                      <LogOut className="h-4 w-4 text-gray-600" />
                      <span className="font-medium">Sair</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setCategoriesOpen(false);
                        setLoginModalOpen(true);
                      }}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors w-full text-left"
                    >
                      <LogIn className="h-4 w-4 text-gray-600" />
                      <span className="font-medium">Entrar</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
