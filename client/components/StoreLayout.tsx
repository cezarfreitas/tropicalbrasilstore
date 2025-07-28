import { ReactNode, useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ShoppingCart,
  Package,
  User,
  LogOut,
  LogIn,
  Menu,
  X,
  Minus,
  Plus,
  Trash2,
  Search,
} from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useCustomerAuth } from "@/hooks/use-customer-auth";
import { LoginModal } from "@/components/LoginModal";
import { RegisterModal } from "@/components/RegisterModal";
import { ThemeIndicator } from "@/components/ThemeIndicator";
import { useGlobalStoreSettings, getGlobalStoreSettings } from "@/hooks/use-global-store-settings";
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
  const { items, totalItems, updateQuantity, removeItem, totalPrice } = useCart();
  const { isAuthenticated, isApproved, customer, logout } = useCustomerAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Use global store settings for instant loading
  const storeSettings = useGlobalStoreSettings();

  // Sync search term with URL params
  useEffect(() => {
    const urlSearchTerm = searchParams.get("busca") || "";
    setSearchTerm(urlSearchTerm);
  }, [searchParams]);

  // Search functionality - memoized
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/loja?busca=${encodeURIComponent(searchTerm.trim())}`);
    }
  }, [searchTerm, navigate]);

  // Memoized navigation links
  const navigationLinks = useMemo(() => [
    { to: "/loja", label: "Todos", icon: Package },
    { to: "/loja?categoria=havaianas", label: "Havaianas", icon: Package },
    { to: "/loja?categoria=adidas", label: "Adidas", icon: Package },
    { to: "/loja?categoria=nike", label: "Nike", icon: Package },
    { to: "/loja?categoria=feminino", label: "Feminino", icon: Package }
  ], []);

  // Memoized cart aria label
  const cartAriaLabel = useMemo(() => 
    `Carrinho com ${totalItems} ${totalItems === 1 ? 'item' : 'itens'}`,
    [totalItems]
  );

  // Logo component that shows only custom logo with immediate global loading
  const LogoDisplay = ({
    size = "h-6 w-6",
    className = ""
  }: {
    size?: string;
    className?: string;
  }) => {
    // Try to get logo from current settings or global settings immediately
    const logoUrl = storeSettings?.logo_url || getGlobalStoreSettings()?.logo_url;

    if (logoUrl) {
      return (
        <div className={`logo-container ${size} ${className}`}>
          <img
            src={logoUrl}
            alt="Logo da Loja"
            className="transition-opacity duration-200 hover:opacity-90"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
            loading="eager"
          />
        </div>
      );
    }
    return null;
  };

  // Fetch categories for mobile menu
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await new Promise<Response>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("GET", "/api/store/categories", true);
          xhr.setRequestHeader("Accept", "application/json");

          xhr.onload = () => {
            const headers = new Headers();
            xhr
              .getAllResponseHeaders()
              .split("\r\n")
              .forEach((line) => {
                const [key, value] = line.split(": ");
                if (key && value) headers.set(key, value);
              });

            const response = new Response(xhr.responseText, {
              status: xhr.status,
              statusText: xhr.statusText,
              headers: headers,
            });
            resolve(response);
          };

          xhr.onerror = () => reject(new Error("Network error"));
          xhr.ontimeout = () => reject(new Error("Request timeout"));
          xhr.timeout = 5000;

          xhr.send();
        });

        if (response.ok) {
          const data = await response.json();
          setCategories([{ id: "all", name: "Todas as Categorias" }, ...data]);
        }
      } catch (error) {
        console.warn("Failed to fetch categories:", error);
        // Set default categories
        setCategories([
          { id: "all", name: "Todas as Categorias" },
          { id: "1", name: "Chinelos" },
          { id: "2", name: "Sandálias" },
          { id: "3", name: "Tênis" },
        ]);
      }
    };

    fetchCategories();
  }, []);

  // Lock body scroll when any drawer is open
  useEffect(() => {
    if (categoriesOpen || cartOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [categoriesOpen, cartOpen]);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-col bg-card border-r border-primary/10 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-16'}`}>
        {/* Sidebar Header */}
        <div className="border-b border-primary/10">
          <Link to="/loja" className="flex items-center justify-center" aria-label="Ir para página inicial">
            <LogoDisplay
              size="w-40 h-40"
              className="flex-shrink-0"
            />
          </Link>
        </div>

        {/* User and Cart Actions */}
        <div className="p-2 border-b border-primary/10 flex gap-1">
          {/* User Menu */}
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-center h-16 p-0"
                  aria-label="Menu do usuário"
                >
                  <User className="h-10 w-10 flex-shrink-0" />
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
              className="w-full justify-center h-16 p-0"
              onClick={() => setLoginModalOpen(true)}
              aria-label="Fazer login"
            >
              <LogIn className="h-10 w-10 flex-shrink-0" />
            </Button>
          )}

          {/* Cart */}
          <Button
            variant="outline"
            className="w-full justify-center h-16 p-0 border-primary/20 hover:bg-primary/5 relative"
            onClick={() => setCartOpen(true)}
            aria-label={cartAriaLabel}
          >
            <ShoppingCart className="h-10 w-10 text-primary flex-shrink-0" />
            {totalItems > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-secondary text-secondary-foreground animate-pulse">
                {totalItems}
              </Badge>
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2" role="navigation" aria-label="Categorias principais">
          {navigationLinks.map((link) => {
            const IconComponent = link.icon;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-3 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg p-3 transition-all duration-200 ${
                  !sidebarOpen ? 'justify-center' : ''
                }`}
                title={!sidebarOpen ? link.label : undefined}
              >
                <IconComponent className="h-4 w-4 flex-shrink-0" />
                {sidebarOpen && <span>{link.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Search and Theme */}
        <div className="p-4 border-t border-primary/10 space-y-2">
          {/* Search */}
          <form onSubmit={handleSearch} className="relative mb-4">
            <Input
              type="text"
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg border-primary/20 focus:border-primary/40 focus:ring-primary/20"
              aria-label="Campo de busca de produtos"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </form>

          {/* Theme Indicator - Desktop */}
          <div className="pt-2">
            <ThemeIndicator />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden border-b bg-background/95 backdrop-blur-sm sticky top-0 z-40 border-primary/10 shadow-sm">
          <div className="container mx-auto px-4">
            {/* Mobile Layout */}
            <div className="flex items-center justify-between py-2">
              {/* Mobile Hamburger Menu */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCategoriesOpen(true)}
                className="h-10 w-10 p-0 hover:bg-primary/5"
                aria-label="Abrir menu de categorias"
              >
                <Menu className="h-5 w-5" />
              </Button>

              {/* Mobile Logo */}
              <Link to="/loja" className="flex items-center" aria-label="Ir para página inicial">
                <LogoDisplay
                  size="w-40 h-40"
                  className="flex-shrink-0"
                />
              </Link>

              {/* Mobile Actions */}
              <div className="flex items-center gap-1">
                {/* Authentication Status */}
                {isAuthenticated ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-10 w-10 p-0" aria-label="Menu do usuário">
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
                    className="h-10 w-10 p-0"
                    onClick={() => setLoginModalOpen(true)}
                    aria-label="Fazer login"
                  >
                    <LogIn className="h-4 w-4" />
                  </Button>
                )}

                {/* Cart */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCartOpen(true)}
                  className="relative h-10 w-10 p-0 border-primary/20 hover:bg-primary/5"
                  aria-label={cartAriaLabel}
                >
                  <ShoppingCart className="h-4 w-4 text-primary" />
                  {totalItems > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-[10px] bg-secondary text-secondary-foreground animate-pulse">
                      {totalItems}
                    </Badge>
                  )}
                </Button>
              </div>
            </div>

            {/* Mobile Search Bar */}
            <div className="flex pb-3">
              <form onSubmit={handleSearch} className="relative w-full">
                <Input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-10 pl-10 pr-14 rounded-lg border-primary/20 focus:border-primary/40 focus:ring-primary/20"
                  aria-label="Campo de busca de produtos"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Button
                  type="submit"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 px-2 text-xs"
                  aria-label="Buscar"
                >
                  <Search className="h-3 w-3" />
                </Button>
              </form>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 lg:p-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t bg-card">
          <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
            <div className="text-center text-xs sm:text-sm text-muted-foreground">
              <p>&copy; 2024 Chinelos Store. Todos os direitos reservados.</p>
              <p className="mt-1 sm:mt-2">
                Sistema de vendas com grades obrigatórias
              </p>
            </div>
          </div>
        </footer>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSwitchToRegister={() => {
          setLoginModalOpen(false);
          setRegisterModalOpen(true);
        }}
        onSuccess={() => {
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
            className="fixed inset-0 bg-black/50 z-50 lg:hidden animate-in fade-in duration-300"
            onClick={() => setCategoriesOpen(false)}
          />

          {/* Drawer */}
          <div className="fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white z-50 shadow-xl animate-in slide-in-from-left duration-300 lg:hidden">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/10 to-secondary/10">
              <h2 className="text-lg font-semibold text-primary">Categorias</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCategoriesOpen(false)}
                className="h-8 w-8 p-0 hover:bg-primary/10"
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
                    to={
                      category.id === "all"
                        ? "/loja"
                        : `/loja?categoria=${category.name.toLowerCase()}`
                    }
                    onClick={() => setCategoriesOpen(false)}
                    className="block w-full p-3 text-left rounded-lg hover:bg-accent/20 hover:border-primary/20 border border-transparent transition-all duration-200"
                  >
                    <span className="font-medium text-gray-800">
                      {category.name}
                    </span>
                  </Link>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-primary mb-3">
                  Ações Rápidas
                </h3>
                <div className="space-y-2">
                  <Link
                    to="/loja/carrinho"
                    onClick={() => setCategoriesOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/20 hover:border-primary/20 border border-transparent transition-all duration-200"
                  >
                    <ShoppingCart className="h-4 w-4 text-primary" />
                    <span className="font-medium text-gray-800">Carrinho</span>
                    {totalItems > 0 && (
                      <Badge
                        variant="secondary"
                        className="ml-auto bg-secondary/20 text-secondary"
                      >
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
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 hover:border-red-200 border border-transparent transition-all duration-200 w-full text-left"
                    >
                      <LogOut className="h-4 w-4 text-red-600" />
                      <span className="font-medium text-gray-800">Sair</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setCategoriesOpen(false);
                        setLoginModalOpen(true);
                      }}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-green-50 hover:border-green-200 border border-transparent transition-all duration-200 w-full text-left"
                    >
                      <LogIn className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-gray-800">Entrar</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Mobile Cart Drawer */}
      {cartOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-300"
            onClick={() => setCartOpen(false)}
          />

          {/* Cart Drawer - from right side */}
          <div className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white z-50 shadow-xl animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/10 to-secondary/10">
              <div>
                <h2 className="text-lg font-semibold text-primary">Carrinho</h2>
                {totalItems > 0 && (
                  <div className="text-xs text-gray-600 mt-1 space-y-1">
                    <p>Total: {totalItems} {totalItems === 1 ? 'peça' : 'peças'}</p>
                    <div className="flex flex-wrap gap-2">
                      {items.map((item) => (
                        <span key={item.id} className="bg-gray-100 px-2 py-0.5 rounded text-[10px]">
                          {item.gradeName || item.sizeName || 'Individual'}: {item.quantity} {item.quantity === 1 ? 'peça' : 'peças'}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCartOpen(false)}
                className="h-8 w-8 p-0 hover:bg-primary/10"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Cart Content */}
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 pb-2">
                {items.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Carrinho vazio
                    </h3>
                    <p className="text-gray-500 text-sm">
                      Adicione produtos para começar
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={item.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-start gap-3">
                          {/* Product Image */}
                          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                            {item.photo ? (
                              <img
                                src={item.photo}
                                alt={item.productName}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <Package className="h-6 w-6 text-gray-400" />
                            )}
                          </div>

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm text-gray-900 truncate">
                              {item.productName}
                            </h4>
                            <p className="text-xs text-gray-600 mt-1">
                              {item.gradeName} - {item.colorName}
                            </p>
                            <p className="text-sm font-bold text-primary mt-1">
                              R$ {item.totalPrice.toFixed(2)}
                            </p>
                          </div>

                          {/* Remove Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs text-gray-600">
                            Quantidade:
                          </span>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                updateQuantity(item.id, item.quantity - 1)
                              }
                              className="h-6 w-6 p-0"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm font-medium w-8 text-center">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                updateQuantity(item.id, item.quantity + 1)
                              }
                              className="h-6 w-6 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cart Footer - Fixed at bottom */}
              {items.length > 0 && (
                <div className="border-t bg-white p-3 sm:p-4 space-y-3 sm:space-y-4 safe-area-inset">
                  {/* Total */}
                  <div className="flex justify-between items-center">
                    <span className="text-base sm:text-lg font-semibold">
                      Total:
                    </span>
                    <span className="text-lg sm:text-xl font-bold text-primary">
                      R$ {totalPrice.toFixed(2)}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <Link
                      to="/loja/checkout"
                      onClick={() => setCartOpen(false)}
                    >
                      <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11 sm:h-10 text-sm sm:text-base font-medium transition-all duration-200 hover:shadow-lg">
                        Finalizar Compra
                      </Button>
                    </Link>
                    <Link
                      to="/loja/carrinho"
                      onClick={() => setCartOpen(false)}
                    >
                      <Button
                        variant="outline"
                        className="w-full h-9 sm:h-10 text-xs sm:text-sm"
                      >
                        Ver Carrinho Completo
                      </Button>
                    </Link>
                  </div>

                  <div className="text-[10px] sm:text-xs text-gray-500 text-center">
                    <p>• Compras por grades (kits)</p>
                    <p>• Confirmação via WhatsApp</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
