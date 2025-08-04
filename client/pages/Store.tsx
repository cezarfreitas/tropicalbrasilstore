import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { StoreLayout } from "@/components/StoreLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProductImage } from "@/components/ProductImage";
import { ColorThemeShowcase } from "@/components/ColorThemeShowcase";
import { getImageUrl } from "@/lib/image-utils";
import { PriceDisplay } from "@/components/PriceDisplay";
import { ProductSkeleton } from "@/components/ProductSkeleton";
import { useCustomerAuth } from "@/hooks/use-customer-auth";
import { useProducts } from "@/hooks/use-products";
import { LoginModal } from "@/components/LoginModal";
import { Package, AlertCircle, ShoppingCart, Search } from "lucide-react";

// Function to get proper color value from different sources
const getColorValue = (color: any) => {
  // If hex_code is provided, use it
  if (color.hex_code) {
    return color.hex_code;
  }

  // Common color name mappings for WooCommerce
  const colorMap: { [key: string]: string } = {
    branco: "#FFFFFF",
    white: "#FFFFFF",
    preto: "#000000",
    black: "#000000",
    azul: "#0066CC",
    blue: "#0066CC",
    vermelho: "#CC0000",
    red: "#CC0000",
    verde: "#228B22",
    green: "#228B22",
    "verde brasil": "#228B22",
    amarelo: "#FFFF99",
    yellow: "#FFFF99",
    "amarelo canário": "#FFFF99",
    "amarelo canario": "#FFFF99",
    rosa: "#FF6699",
    pink: "#FF6699",
    roxo: "#9966CC",
    purple: "#9966CC",
    laranja: "#FF6600",
    orange: "#FF6600",
    marrom: "#996633",
    brown: "#996633",
    cinza: "#999999",
    gray: "#999999",
    grey: "#999999",
  };

  // Try to map by color name
  const colorName = color.name?.toLowerCase();
  if (colorName && colorMap[colorName]) {
    return colorMap[colorName];
  }

  // Default fallback
  return "#E5E7EB";
};

function Store() {
  // Authentication
  const { isAuthenticated, isApproved } = useCustomerAuth();

  // Navigation
  const navigate = useNavigate();

  // URL params for search
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get("busca") || "";
  const colorFilter = searchParams.get("cor")
    ? parseInt(searchParams.get("cor")!)
    : null;
  const categoryFilter = searchParams.get("categoria") || null;
  const genderFilter = searchParams.get("genero")
    ? parseInt(searchParams.get("genero")!)
    : null;
  const typeFilter = searchParams.get("tipo")
    ? parseInt(searchParams.get("tipo")!)
    : null;

  // Products with optimized hook
  const productsPerPage = 20;
  const { products, pagination, loading, error, fetchProducts, currentPage } =
    useProducts(productsPerPage);

  // Login modal
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Track selected variant image for each product
  const [selectedVariantImages, setSelectedVariantImages] = useState<
    Record<number, string>
  >({});

  // Debug products data - focus on missing images
  useEffect(() => {
    if (products && products.length > 0) {
      console.log(`🛍️ Store loaded ${products.length} products`);
      products.forEach((product, index) => {
        const hasPhoto = product.photo && product.photo.trim() !== "";
        const hasColorImages = product.available_colors?.some(
          (c) => c.image_url && c.image_url.trim() !== "",
        );

        if (!hasPhoto && !hasColorImages) {
          console.warn(`⚠️ Product ${product.name} has NO images:`, {
            photo: product.photo,
            available_colors: product.available_colors?.length || 0,
            colors: product.available_colors?.map((c) => ({
              name: c.name,
              image_url: c.image_url,
            })),
          });
        } else {
          console.log(`✅ Product ${product.name} has images:`, {
            photo: product.photo || "null",
            color_images:
              product.available_colors?.filter((c) => c.image_url).length || 0,
          });
        }
      });
    }
  }, [products]);

  // Handlers
  const handleProductClick = (productId: number) => {
    navigate(`/loja/produto/${productId}`);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= (pagination?.totalPages || 1)) {
      fetchProducts(
        newPage,
        searchTerm,
        colorFilter,
        categoryFilter,
        genderFilter,
        typeFilter,
      );
    }
  };

  const handleColorVariantClick = (
    productId: number,
    variantImageUrl: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation(); // Prevent opening the product modal
    setSelectedVariantImages((prev) => ({
      ...prev,
      [productId]: variantImageUrl,
    }));
  };

  // Effect to handle search term, color filter, category filter, gender and type changes
  useEffect(() => {
    fetchProducts(
      1,
      searchTerm,
      colorFilter,
      categoryFilter,
      genderFilter,
      typeFilter,
    );
  }, [
    searchTerm,
    colorFilter,
    categoryFilter,
    genderFilter,
    typeFilter,
    fetchProducts,
  ]);

  // Use all products since we removed filtering
  const filteredProducts = products;

  return (
    <StoreLayout>
      <div className="w-full px-4 lg:px-6 py-3 lg:py-4 space-y-3 lg:space-y-4">
        {/* Search Results Indicator */}
        {searchTerm && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">
                  Resultados para:{" "}
                  <span className="text-primary">"{searchTerm}"</span>
                </span>
              </div>
              <Link
                to="/loja"
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                Limpar busca
              </Link>
            </div>
          </div>
        )}

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
                    onClick={() => fetchProducts(currentPage, searchTerm)}
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

        {/* Loading State - Mobile Otimizado */}
        {loading && (
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-center py-3 sm:py-4">
              <div className="text-center">
                <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-foreground font-medium text-xs sm:text-sm">
                  Carregando produtos...
                </p>
              </div>
            </div>
            {/* Mobile: Mostrar menos skeletons para melhor performance */}
            <ProductSkeleton
              count={window.innerWidth < 640 ? 6 : productsPerPage}
            />
          </div>
        )}

        {/* No Results State */}
        {!loading && filteredProducts.length === 0 && searchTerm && (
          <Card className="border-yellow-200 bg-yellow-50 shadow-lg">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <Search className="h-12 w-12 text-yellow-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                    Nenhum produto encontrado
                  </h3>
                  <p className="text-yellow-700 text-sm mb-4">
                    Não encontramos produtos com o termo "{searchTerm}".
                  </p>
                  <p className="text-yellow-600 text-xs mb-4">
                    Tente buscar por outras palavras como "chinelo", "adidas",
                    "nike", etc.
                  </p>
                </div>
                <div className="flex gap-3 justify-center">
                  <Link to="/loja">
                    <Button
                      variant="default"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      Ver todos os produtos
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filtros Rápidos Mobile */}
        {!loading && filteredProducts.length > 0 && (
          <div className="lg:hidden mb-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <span className="text-xs font-medium text-gray-600 whitespace-nowrap flex-shrink-0">
                Filtros:
              </span>

              {/* Filtro todos */}
              <Link
                to="/loja"
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-200 whitespace-nowrap flex-shrink-0 active:scale-95 ${
                  !categoryFilter &&
                  !colorFilter &&
                  !genderFilter &&
                  !typeFilter
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-gray-600 border-gray-200 hover:border-primary/40"
                }`}
              >
                Todos
              </Link>

              {/* Categorias principais */}
              <Link
                to="/loja?categoria=chinelos"
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-200 whitespace-nowrap flex-shrink-0 active:scale-95 ${
                  categoryFilter === "chinelos"
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-gray-600 border-gray-200 hover:border-primary/40"
                }`}
              >
                Chinelos
              </Link>

              <Link
                to="/loja?categoria=sandálias"
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-200 whitespace-nowrap flex-shrink-0 active:scale-95 ${
                  categoryFilter === "sandálias"
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-gray-600 border-gray-200 hover:border-primary/40"
                }`}
              >
                Sandálias
              </Link>

              <Link
                to="/loja?categoria=tênis"
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-200 whitespace-nowrap flex-shrink-0 active:scale-95 ${
                  categoryFilter === "tênis"
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-gray-600 border-gray-200 hover:border-primary/40"
                }`}
              >
                Tênis
              </Link>
            </div>
          </div>
        )}

        {/* Products Grid */}
        {!loading && filteredProducts.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
              {filteredProducts.map((product, index) => (
                <Card
                  key={product.id}
                  className="group cursor-pointer hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 relative border border-gray-200 hover:border-primary/40 rounded-lg sm:rounded-xl overflow-hidden bg-white active:scale-[0.98] sm:hover:-translate-y-1 touch-manipulation"
                  onClick={() => handleProductClick(product.id)}
                >
                  <CardContent className="p-0 relative">
                    {/* Product Image - Otimizado para mobile */}
                    <div className="aspect-square relative overflow-hidden bg-white">
                      <ProductImage
                        src={getImageUrl(selectedVariantImages[product.id] || product.photo)}
                        alt={product.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-all duration-300 p-2 sm:p-3"
                        priority={index < 8}
                        loading={index < 8 ? "eager" : "lazy"}
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                      />

                      {/* Category Badge - Mobile otimizado */}
                      {product.category_name && (
                        <Badge
                          variant="secondary"
                          className="absolute top-1 left-1 sm:top-1.5 sm:left-1.5 text-[9px] sm:text-[10px] md:text-xs bg-primary text-white px-1 sm:px-1.5 py-0.5 rounded-full shadow-md font-medium"
                        >
                          {product.category_name}
                        </Badge>
                      )}

                      {/* Variant Thumbnails - Mobile friendly */}
                      {product.available_colors &&
                        product.available_colors.length > 0 && (
                          <div className="absolute bottom-1 right-1 sm:bottom-1.5 sm:right-1.5">
                            <div className="flex gap-0.5 sm:gap-1">
                              {product.available_colors
                                .slice(0, 2)
                                .map((color) => (
                                  <div
                                    key={color.id}
                                    className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 rounded-md sm:rounded-lg border-2 border-white cursor-pointer active:scale-95 sm:hover:scale-110 transition-all duration-200 shadow-md sm:shadow-lg overflow-hidden bg-gray-100 touch-manipulation"
                                    title={`${color.name}${color.hex_code ? ` (${color.hex_code})` : ""}`}
                                    onClick={(e) =>
                                      color.image_url &&
                                      handleColorVariantClick(
                                        product.id,
                                        color.image_url,
                                        e,
                                      )
                                    }
                                  >
                                    {color.image_url ? (
                                      <ProductImage
                                        src={color.image_url}
                                        alt={color.name}
                                        className="w-full h-full object-contain"
                                        loading="lazy"
                                        sizes="32px"
                                      />
                                    ) : (
                                      <div
                                        className="w-full h-full flex items-center justify-center text-[6px] sm:text-[7px] lg:text-[8px] font-bold text-white rounded-lg"
                                        style={{
                                          backgroundColor: getColorValue(color),
                                        }}
                                      >
                                        {color.name?.charAt(0)?.toUpperCase()}
                                      </div>
                                    )}
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                    </div>

                    {/* Product Info - Responsivo */}
                    <div className="p-2 sm:p-2.5 md:p-3 space-y-1 sm:space-y-1.5 md:space-y-2">
                      <div>
                        <h3 className="font-medium text-xs sm:text-sm md:text-base text-gray-900 line-clamp-2 leading-tight">
                          {product.name}
                        </h3>
                      </div>

                      {/* Pricing - Mobile friendly */}
                      {product.base_price && (
                        <div className="bg-gray-50 rounded-md sm:rounded-lg p-1.5 sm:p-2">
                          <PriceDisplay
                            price={product.base_price}
                            suggestedPrice={product.suggested_price}
                            variant="default"
                            className="[&>div:first-child]:text-sm [&>div:first-child]:sm:text-lg [&>div:first-child]:md:text-xl [&>div:first-child]:lg:text-2xl"
                            onLoginClick={() => setShowLoginModal(true)}
                          />
                        </div>
                      )}

                      {/* Add to Cart Button - Mobile otimizado */}
                      {isAuthenticated && isApproved && (
                        <Button
                          className="w-full bg-primary hover:bg-primary/90 active:bg-primary/80 text-white text-[10px] sm:text-xs md:text-sm lg:text-base font-medium h-8 sm:h-10 md:h-12 rounded-md sm:rounded-lg transition-all duration-200 active:scale-95 sm:hover:shadow-lg touch-manipulation"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleProductClick(product.id);
                          }}
                        >
                          <span className="hidden sm:inline">
                            Adicionar ao Carrinho
                          </span>
                          <span className="sm:hidden">Comprar</span>
                        </Button>
                      )}
                    </div>

                    {/* Add to Cart Icon - Mobile */}
                    {isAuthenticated && isApproved && (
                      <div
                        className="sm:hidden absolute bottom-2 right-2 bg-primary hover:bg-primary/90 rounded-full p-1.5 shadow-lg transition-all duration-200 active:scale-95"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProductClick(product.id);
                        }}
                      >
                        <ShoppingCart className="h-5 w-5 text-white" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination - Mobile Otimizada */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-6 sm:mt-8">
                {/* Mobile Pagination */}
                <div className="flex items-center justify-between sm:hidden mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!pagination.hasPrevPage}
                    className="flex items-center gap-1 h-9 px-3 text-xs touch-manipulation"
                  >
                    ← Anterior
                  </Button>

                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg px-2 py-1">
                    <span className="text-xs font-medium text-gray-600">
                      {currentPage} de {pagination.totalPages}
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                    className="flex items-center gap-1 h-9 px-3 text-xs touch-manipulation"
                  >
                    Próxima →
                  </Button>
                </div>

                {/* Desktop Pagination */}
                <div className="hidden sm:flex items-center justify-center gap-2">
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
                            variant={
                              page === currentPage ? "default" : "outline"
                            }
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

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </StoreLayout>
  );
}

export default Store;
