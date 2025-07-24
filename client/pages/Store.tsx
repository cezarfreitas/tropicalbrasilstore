import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { StoreLayout } from "@/components/StoreLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProductModal } from "@/components/ProductModal";
import { ProductImage } from "@/components/ProductImage";
import { ColorThemeShowcase } from "@/components/ColorThemeShowcase";
import { FloatingColorButton } from "@/components/FloatingColorButton";
import { PriceDisplay } from "@/components/PriceDisplay";
import { ProductSkeleton } from "@/components/ProductSkeleton";
import { useCustomerAuth } from "@/hooks/use-customer-auth";
import { useProducts } from "@/hooks/use-products";
import { LoginModal } from "@/components/LoginModal";
import { Package, AlertCircle, ShoppingCart } from "lucide-react";

interface StoreProduct {
  id: number;
  name: string;
  description?: string;
  base_price?: number;
  suggested_price?: number;
  photo?: string;
  category_name?: string;
  available_colors?: Array<{
    id: number;
    name: string;
    hex_code?: string;
  }>;
  variant_count?: number;
  total_stock?: number;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalProducts: number;
  productsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

function Store() {
  // Authentication
  const { isAuthenticated, isApproved } = useCustomerAuth();

  // State
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const productsPerPage = 20;

  // Modal
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null,
  );
  const [showProductModal, setShowProductModal] = useState(false);

  // Color showcase
  const [showColorShowcase, setShowColorShowcase] = useState(false);

  // Login modal
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Cache for products
  const [productCache, setProductCache] = useState<Map<string, { data: any; timestamp: number }>>(new Map());
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Optimized fetch products function with cache
  const fetchProducts = async (page: number = 1, retryCount: number = 0) => {
    const cacheKey = `products-${page}-${productsPerPage}`;

    // Check cache first
    const cached = productCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`📦 Using cached products for page ${page}`);
      setProducts(cached.data.products || []);
      setPagination(cached.data.pagination || null);
      setCurrentPage(page);
      setError(null);
      setLoading(false);
      return;
    }

    console.log(`🛒 Fetching products - page: ${page}, retry: ${retryCount}`);
    setLoading(true);
    setError(null);

    try {
      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: productsPerPage.toString(),
      });

      // Try primary endpoint first, then fallback
      const endpoints = [
        `/api/store/products-paginated?${params}`,
        `/api/store-old/products-paginated?${params}`,
      ];

      let response: Response | null = null;
      let lastError: Error | null = null;

      for (const endpoint of endpoints) {
        try {
          console.log(`🔗 Trying endpoint: ${endpoint}`);

          // Try XMLHttpRequest first
          try {
            response = await new Promise<Response>((resolve, reject) => {
              const xhr = new XMLHttpRequest();
              xhr.open("GET", endpoint, true);
              xhr.setRequestHeader("Accept", "application/json");
              xhr.setRequestHeader("Content-Type", "application/json");
              xhr.setRequestHeader("Cache-Control", "no-cache");

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
              xhr.timeout = 20000; // Increased to 20 seconds

              xhr.send();
            });
          } catch (xhrError) {
            console.warn("XMLHttpRequest failed, trying fetch:", xhrError);

            // Fallback to fetch with AbortController
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 20000);

            try {
              response = await fetch(endpoint, {
                signal: controller.signal,
                headers: {
                  Accept: "application/json",
                  "Content-Type": "application/json",
                  "Cache-Control": "no-cache",
                },
              });
              clearTimeout(timeoutId);
            } catch (fetchError) {
              clearTimeout(timeoutId);
              throw fetchError;
            }
          }

          if (response.ok) {
            console.log(`✅ Success with endpoint: ${endpoint}`);
            break;
          } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        } catch (err) {
          console.warn(`��� Failed endpoint ${endpoint}:`, err);
          console.warn(`Error details:`, {
            name: (err as Error).name,
            message: (err as Error).message,
            stack: (err as Error).stack,
          });
          lastError = err as Error;
          response = null;
        }
      }

      if (!response || !response.ok) {
        throw lastError || new Error("All endpoints failed");
      }

      const data = await response.json();
      console.log(`Fetched ${data.products?.length || 0} products`);

      setProducts(data.products || []);
      setPagination(data.pagination || null);
      setCurrentPage(page);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching products:", err);

      // Simple retry for any error
      if (retryCount < 2) {
        console.log(`Retrying... (attempt ${retryCount + 1}/3)`);
        setTimeout(() => fetchProducts(page, retryCount + 1), 1000);
        return;
      }

      // Set error state after all retries
      let errorMessage = "Erro de conex��o. Tente novamente.";

      if (err instanceof Error) {
        if (err.name === "AbortError" || err.message.includes("timeout")) {
          errorMessage =
            "⏱️ Tempo limite esgotado. Verifique sua conexão e tente novamente.";
        } else if (
          err.message.includes("Network") ||
          err.message.includes("network")
        ) {
          errorMessage =
            "🌐 Erro de rede. Verifique sua conexão com a internet.";
        } else if (err.message.includes("All endpoints failed")) {
          errorMessage =
            "🔄 Serviço temporariamente indisponível. Tente novamente em alguns minutos.";
        } else {
          errorMessage = `❌ ${err.message}`;
        }
      }

      console.error("Final error after retries:", errorMessage);
      setError(errorMessage);
      setProducts([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    fetchProducts(1);

    // Listen for promotional banner toggle event
    const handleToggleShowcase = () => {
      setShowColorShowcase(true);
    };

    window.addEventListener("toggleColorShowcase", handleToggleShowcase);
    return () =>
      window.removeEventListener("toggleColorShowcase", handleToggleShowcase);
  }, []);

  // Handlers
  const handleProductClick = (productId: number) => {
    setSelectedProductId(productId);
    setShowProductModal(true);
  };

  const handleCloseModal = () => {
    setShowProductModal(false);
    setSelectedProductId(null);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= (pagination?.totalPages || 1)) {
      fetchProducts(newPage);
    }
  };

  // Use all products since we removed filtering
  const filteredProducts = products;

  return (
    <StoreLayout>
      <div className="container mx-auto px-4 py-6 space-y-6">

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50 shadow-lg">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <AlertCircle className="h-12 w-12 text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-900 mb-2">
                    Erro ao carregar produtos
                  </h3>
                  <p className="text-red-700 text-sm mb-4">{error}</p>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={() => fetchProducts(currentPage)}
                    variant="default"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Tentando...
                      </>
                    ) : (
                      "🔄 Tentar Novamente"
                    )}
                  </Button>
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    size="default"
                  >
                    🔄 Recarregar Página
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            <div className="flex items-center justify-center py-4">
              <div className="text-center">
                <p className="text-foreground font-medium text-sm">
                  Carregando produtos...
                </p>
              </div>
            </div>
            <ProductSkeleton count={productsPerPage} />
          </div>
        )}

        {/* Products Grid */}
        {!loading && filteredProducts.length > 0 && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {filteredProducts.map((product, index) => (
                <Card
                  key={product.id}
                  className="group cursor-pointer hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 relative border hover:border-primary/20"
                  onClick={() => handleProductClick(product.id)}
                >
                  <CardContent className="p-0 relative">
                    {/* Product Image */}
                    <div className="aspect-square relative overflow-hidden rounded-t-lg">
                      <ProductImage
                        src={product.photo}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        priority={index < 8} // Priority loading for first 8 products
                        loading={index < 8 ? "eager" : "lazy"}
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                      />

                      {/* Category Badge */}
                      {product.category_name && (
                        <Badge
                          variant="secondary"
                          className="absolute top-1 left-1 sm:top-2 sm:left-2 text-[10px] sm:text-xs bg-accent/90 text-accent-foreground backdrop-blur-sm px-1 sm:px-2.5 py-0.5 sm:py-1 border border-accent/20"
                        >
                          {product.category_name}
                        </Badge>
                      )}

                      {/* Colors - Mobile: bottom right corner */}
                      {product.available_colors &&
                        product.available_colors.length > 0 && (
                          <div className="absolute bottom-1 right-1 sm:hidden">
                            <div className="flex gap-1 bg-white/80 backdrop-blur-sm rounded-full px-1.5 py-1">
                              {product.available_colors
                                .slice(0, 3)
                                .map((color) => (
                                  <div
                                    key={color.id}
                                    className="w-2.5 h-2.5 rounded-full border border-slate-300"
                                    style={{
                                      backgroundColor: color.hex_code || "#999",
                                    }}
                                    title={color.name}
                                  />
                                ))}
                              {product.available_colors.length > 3 && (
                                <span className="text-[9px] text-slate-600 ml-0.5">
                                  +{product.available_colors.length - 3}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                    </div>

                    {/* Product Info */}
                    <div className="p-2 sm:p-4 space-y-2 sm:space-y-3">
                      <div>
                        <h3 className="font-medium text-xs sm:text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors duration-200">
                          {product.name}
                        </h3>
                      </div>

                      {/* Pricing and Colors */}
                      {product.base_price && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <PriceDisplay
                              price={product.base_price}
                              suggestedPrice={product.suggested_price}
                              variant="default"
                              onLoginClick={() => setShowLoginModal(true)}
                            />
                            {/* Colors - Desktop only */}
                            {product.available_colors &&
                              product.available_colors.length > 0 && (
                                <div className="hidden sm:flex items-center gap-1">
                                  <div className="flex gap-1">
                                    {product.available_colors
                                      .slice(0, 5)
                                      .map((color) => (
                                        <div
                                          key={color.id}
                                          className="w-4 h-4 rounded-full border border-slate-300"
                                          style={{
                                            backgroundColor:
                                              color.hex_code || "#999",
                                          }}
                                          title={color.name}
                                        />
                                      ))}
                                    {product.available_colors.length > 5 && (
                                      <span className="text-xs text-slate-500">
                                        +{product.available_colors.length - 5}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                          </div>
                        </div>
                      )}

                      {/* Add to Cart Button - Desktop only - Only show if authenticated and approved */}
                      {isAuthenticated && isApproved && (
                        <Button
                          className="hidden sm:flex w-full mt-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm h-8 transition-all duration-200 hover:shadow-md"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleProductClick(product.id);
                          }}
                        >
                          Adicionar ao Carrinho
                        </Button>
                      )}
                    </div>

                    {/* Add to Cart Icon - Mobile only, positioned in bottom right - Only show if authenticated and approved */}
                    {isAuthenticated && isApproved && (
                      <div
                        className="sm:hidden absolute bottom-2 right-2 bg-primary hover:bg-primary/90 rounded-full p-2 shadow-lg transition-all duration-200 active:scale-95 border border-primary/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProductClick(product.id);
                        }}
                      >
                        <ShoppingCart className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                >
                  Anterior
                </Button>

                <div className="flex items-center gap-1">
                  {[...Array(Math.min(5, pagination.totalPages))].map(
                    (_, i) => {
                      const page = i + 1;
                      return (
                        <Button
                          key={page}
                          variant={page === currentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                          className={
                            page === currentPage
                              ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                              : ""
                          }
                        >
                          {page}
                        </Button>
                      );
                    },
                  )}
                </div>

                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                >
                  Próxima
                </Button>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!loading && filteredProducts.length === 0 && !error && (
          <div className="text-center py-12">
            <div className="relative">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-accent rounded-full border-2 border-background"></div>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhum produto encontrado
            </h3>
            <p className="text-muted-foreground mb-4">
              Não há produtos disponíveis no momento
            </p>
            <div className="flex items-center justify-center gap-1 mt-4">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
              <div
                className="w-2 h-2 rounded-full bg-secondary animate-pulse"
                style={{ animationDelay: "0.2s" }}
              ></div>
              <div
                className="w-2 h-2 rounded-full bg-accent animate-pulse"
                style={{ animationDelay: "0.4s" }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Product Modal */}
      <ProductModal
        productId={selectedProductId}
        isOpen={showProductModal}
        onClose={handleCloseModal}
        onLoginClick={() => setShowLoginModal(true)}
      />

      {/* Floating Color Button */}
      <FloatingColorButton
        onToggleShowcase={() => setShowColorShowcase(!showColorShowcase)}
        showcaseVisible={showColorShowcase}
      />

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </StoreLayout>
  );
}

export default Store;
