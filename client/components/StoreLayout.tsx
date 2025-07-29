import { ReactNode, useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ShoppingCart,
  Package,
  Package2,
  User,
  LogOut,
  LogIn,
  Menu,
  X,
  Minus,
  Plus,
  Trash2,
  Search,
  ChevronDown,
  CheckCircle2,
  MessageCircle,
  Grid3x3,
  Users,
  Tag,
} from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useCustomerAuth } from "@/hooks/use-customer-auth";
import { LoginModal } from "@/components/LoginModal";
import { RegisterModal } from "@/components/RegisterModal";
import { ThemeIndicator } from "@/components/ThemeIndicator";
import { ProductImage } from "@/components/ProductImage";
import {
  useGlobalStoreSettings,
  getGlobalStoreSettings,
} from "@/hooks/use-global-store-settings";
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
  const {
    items,
    totalItems,
    updateQuantity,
    removeItem,
    totalPrice,
    clearCart,
  } = useCart();
  const { isAuthenticated, isApproved, customer, logout } = useCustomerAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [availableColors, setAvailableColors] = useState<any[]>([]);
  const [selectedColorFilter, setSelectedColorFilter] = useState<number | null>(
    null,
  );
  const [availableGenders, setAvailableGenders] = useState<any[]>([]);
  const [selectedGenderFilter, setSelectedGenderFilter] = useState<
    number | null
  >(null);
  const [availableTypes, setAvailableTypes] = useState<any[]>([]);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<number | null>(
    null,
  );

  // Accordion states for filter sections - sempre fechados por padrão
  const [colorFilterOpen, setColorFilterOpen] = useState(false);
  const [genderFilterOpen, setGenderFilterOpen] = useState(false);
  const [typeFilterOpen, setTypeFilterOpen] = useState(false);

  // Use global store settings for instant loading
  const storeSettings = useGlobalStoreSettings();

  // Sync search term with URL params
  useEffect(() => {
    const urlSearchTerm = searchParams.get("busca") || "";
    setSearchTerm(urlSearchTerm);

    // Sync color filter with URL params
    const colorParam = searchParams.get("cor");
    if (colorParam) {
      setSelectedColorFilter(parseInt(colorParam));
    } else {
      setSelectedColorFilter(null);
    }

    // Sync gender filter with URL params
    const genderParam = searchParams.get("genero");
    if (genderParam) {
      setSelectedGenderFilter(parseInt(genderParam));
    } else {
      setSelectedGenderFilter(null);
    }

    // Sync type filter with URL params
    const typeParam = searchParams.get("tipo");
    if (typeParam) {
      setSelectedTypeFilter(parseInt(typeParam));
    } else {
      setSelectedTypeFilter(null);
    }
  }, [searchParams]);

  // Search functionality - memoized
  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (searchTerm.trim()) {
        navigate(`/loja?busca=${encodeURIComponent(searchTerm.trim())}`);
      }
    },
    [searchTerm, navigate],
  );

  const handleColorFilter = (colorId: number | null) => {
    setSelectedColorFilter(colorId);
    const currentParams = new URLSearchParams(searchParams);

    if (colorId === null) {
      currentParams.delete("cor");
    } else {
      currentParams.set("cor", colorId.toString());
    }

    navigate(`/loja?${currentParams.toString()}`);
  };

  const handleGenderFilter = (genderId: number | null) => {
    setSelectedGenderFilter(genderId);
    const currentParams = new URLSearchParams(searchParams);

    if (genderId === null) {
      currentParams.delete("genero");
    } else {
      currentParams.set("genero", genderId.toString());
    }

    navigate(`/loja?${currentParams.toString()}`);
  };

  const handleTypeFilter = (typeId: number | null) => {
    setSelectedTypeFilter(typeId);
    const currentParams = new URLSearchParams(searchParams);

    if (typeId === null) {
      currentParams.delete("tipo");
    } else {
      currentParams.set("tipo", typeId.toString());
    }

    navigate(`/loja?${currentParams.toString()}`);
  };

  // Memoized navigation links from database categories
  const navigationLinks = useMemo(() => {
    const links = [{ to: "/loja", label: "Todos" }];

    // Add categories that have show_in_menu = true
    categories.forEach((category) => {
      if (category.id !== "all") {
        links.push({
          to: `/loja?categoria=${encodeURIComponent(category.name.toLowerCase())}`,
          label: category.name,
        });
      }
    });

    return links;
  }, [categories]);

  // Memoized cart aria label
  const cartAriaLabel = useMemo(
    () => `Carrinho com ${totalItems} ${totalItems === 1 ? "item" : "itens"}`,
    [totalItems],
  );

  // Logo component that shows only custom logo with immediate global loading
  const LogoDisplay = ({
    size = "h-6 w-6",
    className = "",
  }: {
    size?: string;
    className?: string;
  }) => {
    // Try to get logo from current settings or global settings immediately
    const logoUrl =
      storeSettings?.logo_url || getGlobalStoreSettings()?.logo_url;

    if (logoUrl) {
      return (
        <div className={`logo-container ${size} ${className}`}>
          <img
            src={logoUrl}
            alt="Logo da Loja"
            className="transition-opacity duration-200 hover:opacity-90"
            onError={(e) => {
              // Show fallback when image fails to load
              const fallback = document.createElement("div");
              fallback.className = `${size} bg-primary rounded-lg flex items-center justify-center text-white font-bold text-sm`;
              fallback.textContent = "LOGO";
              e.currentTarget.parentNode?.replaceChild(
                fallback,
                e.currentTarget,
              );
            }}
            loading="eager"
          />
        </div>
      );
    }

    // Fallback logo when no logo is configured
    return (
      <div
        className={`logo-fallback ${size} ${className} bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xs`}
      >
        <Package2 className="h-full w-full p-1" />
      </div>
    );
  };

  // Fetch categories for mobile menu
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await new Promise<Response>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("GET", "/api/categories", true);
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
          // Filter categories to only show those with show_in_menu = true
          const visibleCategories = data.filter(
            (cat: any) => cat.show_in_menu !== false,
          );

          // Remove duplicates by name and clean up encoding issues
          const uniqueCategories = visibleCategories.reduce((acc: any[], cat: any) => {
            // Skip if name contains encoding issues
            if (cat.name && cat.name.includes('�')) {
              return acc;
            }

            // Check if category name already exists
            const exists = acc.some(existing => existing.name === cat.name);
            if (!exists) {
              acc.push(cat);
            }
            return acc;
          }, []);

          setCategories([
            { id: "all", name: "Todos" },
            ...uniqueCategories,
          ]);
        }
      } catch (error) {
        console.warn("Failed to fetch categories:", error);
        // Set default categories
        setCategories([
          { id: "all", name: "Todos" },
          { id: "6", name: "Brasileirinhos" },
          { id: "11", name: "Chinelos" },
          { id: "12", name: "Sandálias" },
          { id: "10", name: "Tênis" },
        ]);
      }
    };

    fetchCategories();
    fetchAvailableColors();
    fetchAvailableGenders();
    fetchAvailableTypes();
  }, []);

  const fetchAvailableColors = async () => {
    try {
      // Use XMLHttpRequest to avoid FullStory conflicts
      const response = await new Promise<Response>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", "/api/colors", true);
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
        const colors = await response.json();
        setAvailableColors(colors);
      }
    } catch (error) {
      console.error("Error fetching colors:", error);
    }
  };

  const fetchAvailableGenders = async () => {
    try {
      // Use XMLHttpRequest to avoid FullStory conflicts
      const response = await new Promise<Response>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", "/api/genders", true);
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
        const genders = await response.json();
        setAvailableGenders(genders);
      }
    } catch (error) {
      console.error("Error fetching genders:", error);
    }
  };

  const fetchAvailableTypes = async () => {
    try {
      // Use XMLHttpRequest to avoid FullStory conflicts
      const response = await new Promise<Response>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", "/api/types", true);
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
        const types = await response.json();
        setAvailableTypes(types);
      }
    } catch (error) {
      console.error("Error fetching types:", error);
    }
  };

  // Lock body scroll when any drawer or modal is open
  useEffect(() => {
    if (categoriesOpen || cartOpen || searchModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [categoriesOpen, cartOpen, searchModalOpen]);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col bg-gradient-to-b from-primary to-primary/95 border-r border-primary/20 shadow-xl w-64 min-h-screen">
        {/* Sidebar Header */}
        <div className="border-b border-white/10 bg-gradient-to-r from-primary to-primary/90 p-3">
          <Link
            to="/loja"
            className="flex items-center justify-center group"
            aria-label="Ir para página inicial"
          >
            <LogoDisplay
              size="w-44 h-24"
              className="flex-shrink-0 transition-all duration-300 group-hover:scale-105 group-hover:brightness-110"
            />
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="px-4 py-3 border-b border-white/10 bg-white/5">
          <div className="grid grid-cols-3 gap-3">
            {/* User Menu */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                {isAuthenticated ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-12 h-12 p-0 rounded-xl bg-white/10 hover:bg-white/20 hover:scale-105 transition-all duration-300 shadow-lg border border-white/20 hover:border-white/40 backdrop-blur-sm"
                      >
                        <User className="h-5 w-5 text-white" />
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
                          {isApproved
                            ? "Conta aprovada"
                            : "Aguardando aprovação"}
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link
                          to="/loja/pedidos"
                          className="flex items-center cursor-pointer"
                        >
                          <Package2 className="h-4 w-4 mr-2" />
                          Meus Pedidos
                        </Link>
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
                    className="w-12 h-12 p-0 rounded-xl bg-white/10 hover:bg-white/20 hover:scale-105 transition-all duration-300 shadow-lg border border-white/20 hover:border-white/40 backdrop-blur-sm"
                    onClick={() => setLoginModalOpen(true)}
                  >
                    <LogIn className="h-5 w-5 text-white" />
                  </Button>
                )}
              </div>
              <span className="text-xs text-white/80 font-medium text-center">
                {isAuthenticated ? "Conta" : "Entrar"}
              </span>
            </div>

            {/* Cart */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <Button
                  variant="ghost"
                  className="w-12 h-12 p-0 rounded-xl bg-white/10 hover:bg-white/20 hover:scale-105 transition-all duration-300 shadow-lg border border-white/20 hover:border-white/40 backdrop-blur-sm"
                  onClick={() => setCartOpen(true)}
                >
                  <ShoppingCart className="h-5 w-5 text-white" />
                </Button>
                {totalItems > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 text-white animate-pulse border-2 border-white shadow-xl font-bold">
                    {totalItems > 99 ? "99+" : totalItems}
                  </Badge>
                )}
              </div>
              <span className="text-xs text-white/80 font-medium">
                Carrinho
              </span>
            </div>

            {/* Search */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <Button
                  variant="ghost"
                  className="w-12 h-12 p-0 rounded-xl bg-white/10 hover:bg-white/20 hover:scale-105 transition-all duration-300 shadow-lg border border-white/20 hover:border-white/40 backdrop-blur-sm"
                  onClick={() => setSearchModalOpen(true)}
                >
                  <Search className="h-5 w-5 text-white" />
                </Button>
              </div>
              <span className="text-xs text-white/80 font-medium">Buscar</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav
          className="flex-1 px-4 py-3 overflow-y-auto"
          role="navigation"
          aria-label="Categorias principais"
        >
          <div className="space-y-1">
            <div className="px-2 mb-3">
              <h3 className="text-sm font-bold text-white/90 uppercase tracking-wider">
                Categorias
              </h3>
            </div>
            {navigationLinks.map((link, index) => {
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className="group flex items-center text-sm font-medium text-white/80 hover:text-white hover:bg-white/15 rounded-xl px-3 py-2 transition-all duration-300 hover:shadow-lg border border-transparent hover:border-white/20 backdrop-blur-sm hover:backdrop-blur-md"
                >
                  <span className="flex-1">{link.label}</span>
                  <ChevronDown className="h-4 w-4 text-white/40 group-hover:text-white/80 rotate-[-90deg] transition-all duration-300" />
                </Link>
              );
            })}

            {/* Color Filter Section */}
            <div className="mt-4 pt-3 border-t border-white/20">
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <button
                    onClick={() => setColorFilterOpen(!colorFilterOpen)}
                    className="flex items-center gap-2 text-sm font-bold text-white/90 hover:text-white transition-all duration-300 group"
                  >
                    <div className="w-2 h-2 bg-gradient-to-br from-red-400 to-blue-400 rounded-full group-hover:scale-110 transition-transform duration-300"></div>
                    <span>Filtrar por Cor</span>
                    <ChevronDown
                      className={`h-4 w-4 transition-all duration-300 ${
                        colorFilterOpen
                          ? "rotate-180 text-white"
                          : "text-white/50 rotate-[-90deg]"
                      }`}
                    />
                  </button>
                  {selectedColorFilter && (
                    <button
                      onClick={() => handleColorFilter(null)}
                      className="text-xs text-white/70 hover:text-white bg-white/10 hover:bg-white/20 px-2 py-1 rounded-full transition-all duration-300"
                    >
                      Limpar
                    </button>
                  )}
                </div>

                {colorFilterOpen && (
                  <>
                    <div className="grid grid-cols-5 gap-2 px-2">
                      {availableColors.map((color) => (
                        <button
                          key={color.id}
                          onClick={() => handleColorFilter(color.id)}
                          className={`group relative w-9 h-9 rounded-xl border-2 transition-all duration-300 hover:scale-110 hover:shadow-xl ${
                            selectedColorFilter === color.id
                              ? "border-white shadow-2xl scale-110 ring-2 ring-white/30"
                              : "border-white/40 hover:border-white/80"
                          }`}
                          title={color.name}
                        >
                          <div
                            className="w-full h-full rounded-xl shadow-inner"
                            style={{
                              backgroundColor: color.hex_code || "#E5E7EB",
                            }}
                          >
                            {!color.hex_code && (
                              <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-700 rounded-xl bg-gray-200">
                                {color.name?.charAt(0)?.toUpperCase()}
                              </div>
                            )}
                          </div>

                          {selectedColorFilter === color.id && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-4 h-4 bg-white rounded-full shadow-2xl border-2 border-gray-300"></div>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>

                    {availableColors.length === 0 && (
                      <div className="text-center py-6 px-4">
                        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-2"></div>
                        <p className="text-sm text-white/70 font-medium">
                          Carregando cores...
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Gender Filter Section */}
            <div className="mt-4 pt-3 border-t border-white/20">
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <button
                    onClick={() => setGenderFilterOpen(!genderFilterOpen)}
                    className="flex items-center gap-2 text-sm font-bold text-white/90 hover:text-white transition-all duration-300 group"
                  >
                    <Users className="h-3 w-3 text-white/70 group-hover:text-white group-hover:scale-110 transition-all duration-300" />
                    <span>Filtrar por Gênero</span>
                    <ChevronDown
                      className={`h-4 w-4 transition-all duration-300 ${
                        genderFilterOpen
                          ? "rotate-180 text-white"
                          : "text-white/50 rotate-[-90deg]"
                      }`}
                    />
                  </button>
                  {selectedGenderFilter && (
                    <button
                      onClick={() => handleGenderFilter(null)}
                      className="text-xs text-white/70 hover:text-white bg-white/10 hover:bg-white/20 px-2 py-1 rounded-full transition-all duration-300"
                    >
                      Limpar
                    </button>
                  )}
                </div>

                {genderFilterOpen && (
                  <>
                    <div className="space-y-1 px-2">
                      {availableGenders.map((gender) => (
                        <button
                          key={gender.id}
                          onClick={() => handleGenderFilter(gender.id)}
                          className={`w-full text-left p-2 rounded-lg text-xs transition-all duration-200 ${
                            selectedGenderFilter === gender.id
                              ? "bg-white/20 text-white font-medium"
                              : "text-white/80 hover:bg-white/10 hover:text-white"
                          }`}
                          title={gender.description}
                        >
                          {gender.name}
                        </button>
                      ))}
                    </div>

                    {availableGenders.length === 0 && (
                      <div className="text-center py-4 px-3">
                        <p className="text-xs text-white/60">
                          Carregando gêneros...
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Type Filter Section */}
            <div className="mt-4 pt-3 border-t border-white/20">
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <button
                    onClick={() => setTypeFilterOpen(!typeFilterOpen)}
                    className="flex items-center gap-2 text-sm font-bold text-white/90 hover:text-white transition-all duration-300 group"
                  >
                    <Tag className="h-3 w-3 text-white/70 group-hover:text-white group-hover:scale-110 transition-all duration-300" />
                    <span>Filtrar por Tipo</span>
                    <ChevronDown
                      className={`h-4 w-4 transition-all duration-300 ${
                        typeFilterOpen
                          ? "rotate-180 text-white"
                          : "text-white/50 rotate-[-90deg]"
                      }`}
                    />
                  </button>
                  {selectedTypeFilter && (
                    <button
                      onClick={() => handleTypeFilter(null)}
                      className="text-xs text-white/70 hover:text-white bg-white/10 hover:bg-white/20 px-2 py-1 rounded-full transition-all duration-300"
                    >
                      Limpar
                    </button>
                  )}
                </div>

                {typeFilterOpen && (
                  <>
                    <div className="space-y-1 px-2">
                      {availableTypes.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => handleTypeFilter(type.id)}
                          className={`w-full text-left p-2 rounded-xl text-xs transition-all duration-300 group ${
                            selectedTypeFilter === type.id
                              ? "bg-white/20 text-white font-bold shadow-lg border border-white/30"
                              : "text-white/80 hover:bg-white/15 hover:text-white border border-transparent hover:border-white/20"
                          }`}
                          title={type.description}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{type.name}</span>
                          </div>
                        </button>
                      ))}
                    </div>

                    {availableTypes.length === 0 && (
                      <div className="text-center py-4 px-3">
                        <p className="text-xs text-white/60">
                          Carregando tipos...
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>
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
              <Link
                to="/loja"
                className="flex items-center bg-primary rounded-lg"
                aria-label="Ir para página inicial"
              >
                <LogoDisplay size="w-32 h-32" className="flex-shrink-0" />
              </Link>

              {/* Mobile Actions */}
              <div className="flex items-center gap-1">
                {/* Authentication Status */}
                {isAuthenticated ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-10 w-10 p-0"
                        aria-label="Menu do usuário"
                      >
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
                          {isApproved
                            ? "Conta aprovada"
                            : "Aguardando aprovação"}
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link
                          to="/loja/pedidos"
                          className="flex items-center cursor-pointer"
                        >
                          <Package2 className="h-4 w-4 mr-2" />
                          Meus Pedidos
                        </Link>
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
        <main className="flex-1 lg:p-6">{children}</main>

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

      {/* Search Modal */}
      {searchModalOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-300"
            onClick={() => setSearchModalOpen(false)}
          />

          {/* Modal */}
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-lg shadow-xl z-50 animate-in zoom-in-95 duration-300">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">
                  Buscar Produtos
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchModalOpen(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form
                onSubmit={(e) => {
                  handleSearch(e);
                  setSearchModalOpen(false);
                }}
                className="space-y-4"
              >
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Digite o que você procura..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-12 pl-12 pr-4 rounded-lg border-primary/20 focus:border-primary/40 focus:ring-primary/20"
                    autoFocus
                  />
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                    disabled={!searchTerm.trim()}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Buscar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSearchModalOpen(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

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

      {/* Cart Drawer */}
      {cartOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-300"
            onClick={() => setCartOpen(false)}
          />

          {/* Cart Drawer - from right side */}
          <div className="fixed top-0 right-0 h-screen w-96 max-w-[90vw] bg-white z-50 shadow-2xl animate-in slide-in-from-right duration-300 border-l border-gray-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Carrinho</h2>
                  {totalItems > 0 && (
                    <p className="text-sm text-gray-600">
                      {items.length}{" "}
                      {items.length === 1 ? "produto" : "produtos"} •{" "}
                      {totalItems} {totalItems === 1 ? "item" : "itens"}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCartOpen(false)}
                className="h-9 w-9 p-0 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Cart Content */}
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <ShoppingCart className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Seu carrinho está vazio
                    </h3>
                    <p className="text-gray-500 text-sm mb-6">
                      Explore nossa loja e adicione produtos incríveis
                    </p>
                    <Button
                      onClick={() => setCartOpen(false)}
                      className="bg-primary hover:bg-primary/90 text-white"
                    >
                      Continuar Comprando
                    </Button>
                  </div>
                ) : (
                  <div className="p-4 space-y-4">
                    {items.map((item, index) => (
                      <div
                        key={item.id}
                        className="group bg-gray-50 hover:bg-gray-100 rounded-xl p-4 transition-all duration-200 border border-gray-100 hover:border-gray-200"
                      >
                        <div className="flex items-start gap-4">
                          {/* Product Image */}
                          <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-100">
                            {item.photo ? (
                              <ProductImage
                                src={item.photo}
                                alt={item.productName}
                                className="w-full h-full object-contain"
                                loading="lazy"
                                sizes="64px"
                                fallbackIconSize="sm"
                              />
                            ) : (
                              <Package className="h-8 w-8 text-gray-400" />
                            )}
                          </div>

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm text-gray-900 line-clamp-2 leading-tight mb-2">
                              {item.productName}
                            </h4>

                            {/* Grade Info */}
                            {item.type === "grade" && (
                              <div className="space-y-1 mb-3">
                                <div className="flex items-center gap-2">
                                  <Grid3x3 className="h-3 w-3 text-primary" />
                                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                    {item.gradeName}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-600">
                                  Cor: {item.colorName} •{" "}
                                  {item.piecesPerGrade || 0} itens por grade
                                </p>
                              </div>
                            )}

                            {/* Price and Quantity */}
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <p className="text-lg font-bold text-primary">
                                  R$ {item.totalPrice.toFixed(2)}
                                </p>
                                {item.quantity > 1 && (
                                  <p className="text-xs text-gray-500">
                                    {item.quantity} × R${" "}
                                    {item.unitPrice.toFixed(2)}
                                  </p>
                                )}
                              </div>

                              {/* Quantity Controls */}
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    updateQuantity(
                                      item.id,
                                      Math.max(1, item.quantity - 1),
                                    )
                                  }
                                  className="h-7 w-7 p-0 hover:bg-primary hover:text-white border-gray-300"
                                  disabled={item.quantity <= 1}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="text-sm font-semibold w-8 text-center bg-white px-2 py-1 rounded border">
                                  {item.quantity}
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    updateQuantity(
                                      item.id,
                                      Math.min(99, item.quantity + 1),
                                    )
                                  }
                                  className="h-7 w-7 p-0 hover:bg-primary hover:text-white border-gray-300"
                                  disabled={item.quantity >= 99}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Remove Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                            className="h-7 w-7 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all duration-200"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {/* Quick Actions */}
                    {items.length > 1 && (
                      <div className="border-t pt-4 mt-6">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (
                              confirm(
                                "Tem certeza que deseja limpar todo o carrinho?",
                              )
                            ) {
                              clearCart();
                            }
                          }}
                          className="w-full text-gray-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Limpar Carrinho
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Cart Footer - Fixed at bottom */}
              {items.length > 0 && (
                <div className="border-t bg-white p-4 pb-28 space-y-4">
                  {/* Summary */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">
                        R$ {totalPrice.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Frete</span>
                      <span className="font-medium text-blue-600">
                        A calcular
                      </span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-gray-900">
                          Total
                        </span>
                        <span className="text-xl font-bold text-primary">
                          R$ {totalPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-6">
                    <Link
                      to="/loja/checkout"
                      onClick={() => setCartOpen(false)}
                    >
                      <Button className="w-full bg-primary hover:bg-primary/90 text-white h-12 text-base font-semibold rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                        <CheckCircle2 className="h-5 w-5 mr-2" />
                        Finalizar Compra
                      </Button>
                    </Link>
                    <Link
                      to="/loja/carrinho"
                      onClick={() => setCartOpen(false)}
                    >
                      <Button
                        variant="outline"
                        className="w-full h-10 text-sm font-medium border-gray-200 hover:bg-gray-50"
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Ver Carrinho Completo
                      </Button>
                    </Link>
                  </div>

                  {/* Trust indicators */}
                  <div className="flex items-center justify-center gap-4 text-xs text-gray-500 pt-2 border-t">
                    <div className="flex items-center gap-1">
                      <Grid3x3 className="h-3 w-3" />
                      <span>Venda por grades</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      <span>Confirmação via WhatsApp</span>
                    </div>
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
