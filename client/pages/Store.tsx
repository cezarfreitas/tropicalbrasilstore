import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { StoreLayout } from "@/components/StoreLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProductModal } from "@/components/ProductModal";
import { useCustomerAuth } from "@/hooks/use-customer-auth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Package,
  ShoppingCart,
  Filter,
  Menu,
  X,
  ChevronRight,
  Lock,
  User,
  LogIn,
} from "lucide-react";
import { LoginModal } from "@/components/LoginModal";
import { RegisterModal } from "@/components/RegisterModal";

interface StoreProduct {
  id: number;
  name: string;
  description?: string;
  base_price?: number;
  suggested_price?: number;
  photo?: string;
  category_name?: string;
  variant_count: number;
  total_stock: number;
  available_colors?: Array<{
    id: number;
    name: string;
    hex_code?: string;
    variant_count?: number;
    total_stock?: number;
  }>;
  available_sizes?: Array<{
    id: number;
    size: string;
    display_order: number;
    variant_count?: number;
    total_stock?: number;
  }>;
  price_range?: {
    min?: number;
    max?: number;
  };
}

interface FilterOption {
  id: string;
  name: string;
  description?: string;
}

interface FiltersSidebarProps {
  categories: FilterOption[];
  colors: FilterOption[];
  selectedCategory: string;
  selectedColors: string[];
  selectedGrades: string[];
  priceRange: [number, number];
  maxPrice: number;
  onCategorySelect: (categoryId: string) => void;
  onColorToggle: (colorId: string) => void;
  onGradeToggle: (gradeId: string) => void;
  onPriceRangeChange: (range: [number, number]) => void;
  onClearFilters: () => void;
}

function FiltersSidebar({
  categories,
  colors,
  selectedCategory,
  selectedColors,
  selectedGrades,
  priceRange,
  maxPrice,
  onCategorySelect,
  onColorToggle,
  onGradeToggle,
  onPriceRangeChange,
  onClearFilters,
}: FiltersSidebarProps) {
  const hasActiveFilters =
    selectedCategory !== "all" ||
    selectedColors.length > 0 ||
    selectedGrades.length > 0 ||
    priceRange[0] > 0 ||
    priceRange[1] < maxPrice;

  const gradeOptions = [
    { id: "feminino", name: "Feminino" },
    { id: "masculino", name: "Masculino" },
    { id: "infantil", name: "Infantil" },
    { id: "premium", name: "Premium" },
  ];

  return (
    <div className="space-y-6">
      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <div className="pb-4 border-b">
          <Button
            onClick={onClearFilters}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <X className="h-4 w-4 mr-2" />
            Limpar Filtros
          </Button>
        </div>
      )}

      {/* Categories */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Categorias</h3>
        <nav className="space-y-1">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategorySelect(category.id)}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                selectedCategory === category.id
                  ? "bg-primary text-primary-foreground"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
                            <span>{category.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Colors */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cores</h3>
        <div className="space-y-2">
          {colors.map((color) => (
            <label
              key={color.id}
              className="flex items-center space-x-3 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedColors.includes(color.id)}
                onChange={() => onColorToggle(color.id)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
                            <span className="text-sm text-gray-700">{color.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Grades/Types */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tipos</h3>
        <div className="space-y-2">
          {gradeOptions.map((grade) => (
            <label
              key={grade.id}
              className="flex items-center space-x-3 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedGrades.includes(grade.id)}
                onChange={() => onGradeToggle(grade.id)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">{grade.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Preço</h3>
        <div className="space-y-4">
          <div className="px-2">
            <input
              type="range"
              min="0"
              max={maxPrice}
              value={priceRange[1]}
              onChange={(e) =>
                onPriceRangeChange([priceRange[0], parseInt(e.target.value)])
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>R$ {priceRange[0].toFixed(2)}</span>
            <span>R$ {priceRange[1].toFixed(2)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              min="0"
              max={maxPrice}
              value={priceRange[0]}
              onChange={(e) =>
                onPriceRangeChange([
                  parseInt(e.target.value) || 0,
                  priceRange[1],
                ])
              }
              placeholder="Min"
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            />
            <span className="text-gray-500">-</span>
            <input
              type="number"
              min="0"
              max={maxPrice}
              value={priceRange[1]}
              onChange={(e) =>
                onPriceRangeChange([
                  priceRange[0],
                  parseInt(e.target.value) || maxPrice,
                ])
              }
              placeholder="Max"
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Store() {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null,
  );
    const [isModalOpen, setIsModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
      const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);

  // Customer authentication
  const { isAuthenticated, isApproved, isFirstLogin, customer } =
    useCustomerAuth();

  // Redirect to password change if first login
  if (isAuthenticated && isFirstLogin) {
    return <Navigate to="/change-password" replace />;
  }

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const productsPerPage = 20;

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200]);
  const [maxPrice, setMaxPrice] = useState<number>(200);

    // Filter options
  const [categories, setCategories] = useState<FilterOption[]>([]);
  const [colors, setColors] = useState<FilterOption[]>([]);

  useEffect(() => {
    fetchProducts();
  }, []);

    useEffect(() => {
    fetchProducts();
  }, [
    currentPage,
    selectedCategory,
  ]);

                        const fetchProducts = async (retryCount = 0, useBackup = false) => {
    console.log(`Starting fetchProducts (retry: ${retryCount}, backup: ${useBackup})`);

    setLoading(true);
    setFetchError(null);
    setRetryAttempt(retryCount);

    // Safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
      console.error("fetchProducts took too long, forcing loading to false");
      setLoading(false);
      setFetchError("Tempo limite excedido. Tente novamente.");
    }, 30000); // 30 seconds max

    try {
      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: productsPerPage.toString(),
      });

      if (selectedCategory !== "all") {
        params.append("category", selectedCategory);
      }

      const endpoint = useBackup
        ? `/api/store-old/products-paginated?${params}`
        : `/api/store/products-paginated?${params}`;

      console.log(`Fetching products from ${endpoint}`, retryCount > 0 ? `(retry ${retryCount})` : "");

      // Test server connectivity first for initial requests
      if (retryCount === 0) {
        try {
          const healthCheck = await fetch('/api/ping', {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(3000)
          });
          if (!healthCheck.ok) {
            throw new Error('Server not responding');
          }
        } catch (healthError) {
          console.warn('Server health check failed:', healthError);
          // Continue with the main request anyway
        }
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // Increased timeout to 15 seconds

      const response = await fetch(endpoint, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        // Add credentials and other options for better compatibility
        credentials: 'same-origin',
        mode: 'cors',
      });

      clearTimeout(timeoutId);
      console.log("Response status:", response.status);

      if (response.ok) {
        const responseData = await response.json();
        console.log(
          "Products fetched successfully:",
          responseData.products?.length || 0,
          "products",
        );

        // Handle paginated response
        const productsData = responseData.products || [];
        const pagination = responseData.pagination || {};

        setFilteredProducts(productsData);
        setTotalProducts(pagination.total || 0);
        setTotalPages(pagination.totalPages || 0);

        // On first load or category change, also fetch categories and colors
        if (currentPage === 1) {
          await fetchFilters();
        }
      } else {
        console.error("API response not ok:", response.status, response.statusText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
        } catch (error) {
      console.error("Error fetching products:", error);

      // Safe error logging
      const errorInfo: any = {};
      try {
        if (error instanceof Error) {
          errorInfo.message = error.message;
          errorInfo.name = error.name;
          if (error.name === 'AbortError') {
            errorInfo.reason = 'Request timeout';
          }
        } else {
          errorInfo.error = String(error);
        }
        console.error("Error details:", errorInfo);
      } catch (logError) {
        console.error("Could not log error details:", logError);
      }

            // Retry logic for network errors - simplified
      if (retryCount < 2 && (
        error instanceof TypeError ||
        (error instanceof Error && error.name === 'AbortError')
      )) {
        console.log(`Will retry fetch... (attempt ${retryCount + 1})`);
        // Let finally block handle cleanup, then retry
        setTimeout(() => {
          console.log(`Executing retry ${retryCount + 1}`);
          fetchProducts(retryCount + 1, retryCount >= 1);
        }, 2000); // Fixed 2 second delay
        return;
      }

                  // Set empty state as fallback after all retries failed
      setFetchError("Não foi possível carregar os produtos. Verifique sua conexão e tente novamente.");

      // Provide a minimal fallback structure
      setFilteredProducts([]);
      setCategories([
        {
          id: "all",
          name: "Todas as Categorias",
        },
        {
          id: "1",
          name: "Chinelos",
        },
      ]);
      setColors([
        { id: "all", name: "Todas as Cores" },
      ]);
      setMaxPrice(100);
      setPriceRange([0, 100]);
    } finally {
      // Clear safety timeout and loading state
      clearTimeout(safetyTimeout);
      setLoading(false);
      console.log(`fetchProducts completed (retry: ${retryCount})`);
    }
  };

  const fetchFilters = async () => {
    try {
      // Fetch categories
      const categoriesResponse = await fetch("/api/store-old/categories");
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData);
      }

      // Extract colors from current products
      // This is simpler than making another API call
      const uniqueColors = new Set<string>();
      filteredProducts.forEach((product: StoreProduct) => {
        if (product.available_colors && Array.isArray(product.available_colors)) {
          product.available_colors.forEach((color) => {
            if (color && color.name) {
              uniqueColors.add(color.name);
            }
          });
        }
      });

      setColors([
        ...Array.from(uniqueColors).map((color) => ({
          id: color.toLowerCase(),
          name: color,
        })),
      ]);

    } catch (error) {
      console.error("Error fetching filters:", error);
    }
  };

  const applyFilters = () => {
    let filtered = [...allProducts];

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (product) => product.category_name?.toLowerCase() === selectedCategory,
      );
    }

    // Color filter
    if (selectedColors.length > 0) {
      filtered = filtered.filter((product) =>
        product.available_colors?.some((color) =>
          selectedColors.includes(color.name.toLowerCase()),
        ),
      );
    }

    // Grade/Type filter
    if (selectedGrades.length > 0) {
      filtered = filtered.filter((product) => {
        const productName = product.name.toLowerCase();
        return selectedGrades.some((grade) => {
          switch (grade) {
            case "feminino":
              return (
                productName.includes("feminino") ||
                productName.includes("mulher")
              );
            case "masculino":
              return (
                productName.includes("masculino") ||
                productName.includes("homem")
              );
            case "infantil":
              return (
                productName.includes("infantil") ||
                productName.includes("criança")
              );
            case "premium":
              return (
                productName.includes("premium") ||
                productName.includes("confort")
              );
            default:
              return false;
          }
        });
      });
    }

        // Price filter
    filtered = filtered.filter((product) => {
      try {
        const price = parseFloat(product.suggested_price?.toString() || product.base_price?.toString() || "0");
        return !isNaN(price) && price >= priceRange[0] && price <= priceRange[1];
      } catch (error) {
        console.warn("Error parsing price for product:", product.id, error);
        return true; // Include product if price parsing fails
      }
    });

    // Apply pagination
    const total = filtered.length;
    const totalPages = Math.ceil(total / productsPerPage);
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const paginatedProducts = filtered.slice(startIndex, endIndex);

    setProducts(filtered);
    setFilteredProducts(paginatedProducts);
    setTotalProducts(total);
    setTotalPages(totalPages);
  };

  // Filter manipulation functions
  const handleColorToggle = (colorId: string) => {
    setSelectedColors((prev) =>
      prev.includes(colorId)
        ? prev.filter((id) => id !== colorId)
        : [...prev, colorId],
    );
    setCurrentPage(1);
  };

  const handleGradeToggle = (gradeId: string) => {
    setSelectedGrades((prev) =>
      prev.includes(gradeId)
        ? prev.filter((id) => id !== gradeId)
        : [...prev, gradeId],
    );
    setCurrentPage(1);
  };

  const handlePriceRangeChange = (range: [number, number]) => {
    setPriceRange(range);
    setCurrentPage(1);
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setSelectedCategory("all");
    setSelectedColors([]);
    setSelectedGrades([]);
    setPriceRange([0, maxPrice]);
    setCurrentPage(1);
  };

  const openModal = (productId: number) => {
    setSelectedProductId(productId);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProductId(null);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const generatePageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("ellipsis");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("ellipsis");
        pages.push(totalPages);
      }
    }

    return pages;
  };

    if (loading) {
    return (
      <StoreLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">
              {retryAttempt > 0 ? `Tentativa ${retryAttempt + 1} de carregamento...` : "Carregando produtos..."}
            </p>
          </div>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div className="flex min-h-screen bg-gray-50">
        {/* Mobile sidebar overlay */}
        <div
          className={`fixed inset-0 z-50 lg:hidden ${
            sidebarOpen ? "block" : "hidden"
          }`}
        >
          <div
            className="fixed inset-0 bg-black/20"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-72 sm:w-80 bg-white shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Filtros</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(100vh-80px)]">
              <Button
                variant="outline"
                onClick={() => setSidebarOpen(false)}
                className="w-full mb-4 h-10"
              >
                Aplicar Filtros
              </Button>
              <FiltersSidebar
                categories={categories}
                colors={colors}
                selectedCategory={selectedCategory}
                selectedColors={selectedColors}
                selectedGrades={selectedGrades}
                priceRange={priceRange}
                maxPrice={maxPrice}
                onCategorySelect={(categoryId) => {
                  handleCategorySelect(categoryId);
                  setSidebarOpen(false);
                }}
                onColorToggle={handleColorToggle}
                onGradeToggle={handleGradeToggle}
                onPriceRangeChange={handlePriceRangeChange}
                onClearFilters={clearAllFilters}
              />
            </div>
          </div>
        </div>

        {/* Desktop sidebar */}
        <div className="hidden lg:flex lg:w-64 lg:flex-col">
          <div className="flex-1 bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
            <div className="px-4">
              <FiltersSidebar
                categories={categories}
                colors={colors}
                selectedCategory={selectedCategory}
                selectedColors={selectedColors}
                selectedGrades={selectedGrades}
                priceRange={priceRange}
                maxPrice={maxPrice}
                onCategorySelect={handleCategorySelect}
                onColorToggle={handleColorToggle}
                onGradeToggle={handleGradeToggle}
                onPriceRangeChange={handlePriceRangeChange}
                onClearFilters={clearAllFilters}
              />
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto">
          <div className="lg:hidden flex items-center justify-between p-3 sm:p-4 bg-white border-b">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="h-9"
            >
              <Menu className="h-4 w-4 mr-2" />
              Filtros
            </Button>
            <h1 className="text-base sm:text-lg font-semibold">
              Chinelos Store
            </h1>
          </div>

                    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-5 pb-6 sm:pb-8">
            {/* Login Prompt for non-authenticated users */}
            {!isAuthenticated && (
              <div className="mb-6 sm:mb-8">
                <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                          <Lock className="h-6 w-6 text-primary-foreground" />
                        </div>
                      </div>
                      <div className="flex-1 text-center sm:text-left">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Faça login para ver preços especiais
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Entre com sua conta para acessar preços exclusivos e fazer pedidos de grades
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <Button
                          onClick={() => setLoginModalOpen(true)}
                          className="bg-primary hover:bg-primary/90"
                        >
                          <LogIn className="h-4 w-4 mr-2" />
                          Entrar agora
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Account status for authenticated but not approved users */}
            {isAuthenticated && !isApproved && (
              <div className="mb-6 sm:mb-8">
                <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                          <User className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Conta em análise
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Sua conta está sendo analisada. Em breve você terá acesso aos preços e poderá fazer pedidos.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Products Grid */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold">
                  Nossos Produtos
                </h2>
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {filteredProducts.length} produto
                  {filteredProducts.length !== 1 ? "s" : ""} encontrado
                  {filteredProducts.length !== 1 ? "s" : ""}
                </span>
              </div>
                            {fetchError ? (
                <div className="text-center py-12">
                  <Package className="mx-auto h-16 w-16 text-destructive/50" />
                  <h3 className="mt-4 text-lg font-semibold text-destructive">
                    Erro ao carregar produtos
                  </h3>
                  <p className="mt-2 text-muted-foreground max-w-md mx-auto">
                    {fetchError}
                  </p>
                  <Button
                    onClick={() => fetchProducts()}
                    className="mt-4"
                    variant="outline"
                  >
                    Tentar novamente
                  </Button>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="mx-auto h-16 w-16 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-semibold">
                    Nenhum produto disponível
                  </h3>
                  <p className="mt-2 text-muted-foreground">
                    No momento não temos produtos em estoque.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {filteredProducts.map((product) => (
                    <Card
                      key={product.id}
                      className="overflow-hidden h-full transition-transform hover:scale-105"
                    >
                      <div className="aspect-square bg-muted flex items-center justify-center relative">
                        {product.photo ? (
                          <img
                            src={product.photo}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = '<div class="flex items-center justify-center w-full h-full"><svg class="h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg></div>';
                              }
                            }}
                          />
                        ) : (
                          <Package className="h-12 w-12 text-muted-foreground/50" />
                        )}
                        {/* Category badge overlay */}
                        {product.category_name && (
                          <Badge
                            variant="secondary"
                            className="absolute top-2 left-2 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 bg-white/90 backdrop-blur-sm shadow-sm border-0"
                          >
                            {product.category_name}
                          </Badge>
                        )}
                      </div>
                      <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                        {/* Header - Nome */}
                        <div className="space-y-2">
                          <h3 className="font-semibold text-xs sm:text-sm line-clamp-2 leading-tight min-h-[28px] sm:min-h-[32px]">
                            {product.name}
                          </h3>
                          <div className="flex items-center justify-center">
                            {product.available_colors &&
                            product.available_colors.length > 0 ? (
                              <div className="flex items-center gap-1.5">
                                {product.available_colors
                                  .slice(0, 5)
                                  .map((color, index) => (
                                    <div
                                      key={color.id}
                                      className="relative group"
                                    >
                                      <div
                                        className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform cursor-pointer"
                                        style={{
                                          backgroundColor:
                                            color.hex_code || "#999999",
                                          boxShadow:
                                            "0 0 0 1px rgba(0,0,0,0.1)",
                                        }}
                                      />
                                      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                        {color.name}
                                      </div>
                                    </div>
                                  ))}
                                {product.available_colors.length > 5 && (
                                  <span className="text-[10px] sm:text-xs text-muted-foreground font-medium ml-1">
                                    +{product.available_colors.length - 5}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] sm:text-xs text-muted-foreground bg-muted px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
                                {product.variant_count} cores
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Pricing Section */}
                        <div className="text-center space-y-1">
                                                    {isApproved ? (
                            <div className="text-center space-y-1">
                              {product.base_price && (
                                <div>
                                  <div className="text-lg sm:text-2xl font-bold text-primary">
                                    R$ {parseFloat(product.base_price).toFixed(2)}
                                  </div>
                                  <div className="text-[10px] sm:text-xs text-muted-foreground font-medium">
                                    UNIT��RIO
                                  </div>
                                </div>
                              )}

                              {product.suggested_price &&
                                product.suggested_price !== product.base_price && (
                                  <div className="pt-1">
                                    <div className="text-[10px] sm:text-xs text-muted-foreground/70 line-through">
                                      Sugerido: R$ {parseFloat(product.suggested_price.toString()).toFixed(2)}
                                    </div>
                                  </div>
                                )}
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2 py-3 sm:py-4 px-2 sm:px-3 bg-gray-50 border border-gray-200 rounded-lg">
                              <Lock className="h-4 w-4 text-muted-foreground" />
                              <div className="text-center">
                                <div className="text-xs sm:text-sm font-medium text-muted-foreground text-center">
                                  {isAuthenticated
                                    ? customer?.status === "pending"
                                      ? "Aguardando aprovação"
                                      : customer?.status === "rejected"
                                        ? "Cadastro rejeitado"
                                        : "Faça login para ver preços"
                                    : "Faça login para ver preços"}
                                </div>
                                                                {!isAuthenticated && (
                                  <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setLoginModalOpen(true);
                                      }}
                                      className="text-primary hover:underline"
                                    >
                                      Clique para entrar
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Add to Cart Button */}
                        <div className="border-t pt-3">
                          {isApproved ? (
                            <Button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                openModal(product.id);
                              }}
                              className="w-full h-8 sm:h-9 text-[10px] sm:text-xs font-medium"
                              size="sm"
                            >
                              <ShoppingCart className="mr-1 sm:mr-2 h-3 w-3" />
                              <span className="hidden sm:inline">
                                Adicionar ao{" "}
                              </span>
                              Carrinho
                            </Button>
                                                    ) : (
                            <Button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (!isAuthenticated) {
                                  setLoginModalOpen(true);
                                }
                              }}
                              variant="outline"
                              className="w-full h-8 sm:h-9 text-[10px] sm:text-xs font-medium"
                              size="sm"
                              disabled={isAuthenticated}
                            >
                              <User className="mr-2 h-3 w-3" />
                              {isAuthenticated
                                ? customer?.status === "pending"
                                  ? "Aguardando Aprovação"
                                  : "Não Autorizado"
                                : "Faça Login"}
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex flex-col items-center gap-4">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {(currentPage - 1) * productsPerPage + 1} a{" "}
                    {Math.min(currentPage * productsPerPage, totalProducts)} de{" "}
                    {totalProducts} produtos
                  </div>

                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() =>
                            currentPage > 1 && handlePageChange(currentPage - 1)
                          }
                          className={
                            currentPage <= 1
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>

                      {generatePageNumbers().map((page, index) =>
                        page === "ellipsis" ? (
                          <PaginationItem key={`ellipsis-${index}`}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        ) : (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => handlePageChange(page as number)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ),
                      )}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            currentPage < totalPages &&
                            handlePageChange(currentPage + 1)
                          }
                          className={
                            currentPage >= totalPages
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

            <ProductModal
        productId={selectedProductId}
        isOpen={isModalOpen}
        onClose={closeModal}
      />

            <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSwitchToRegister={() => {
          setLoginModalOpen(false);
          setRegisterModalOpen(true);
        }}
        onSuccess={() => {
          // Refresh the page after successful login
          window.location.reload();
        }}
      />

      <RegisterModal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        onSwitchToLogin={() => {
          setRegisterModalOpen(false);
          setLoginModalOpen(true);
        }}
      />
    </StoreLayout>
  );
}
