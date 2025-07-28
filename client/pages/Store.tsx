import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { StoreLayout } from "@/components/StoreLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProductImage } from "@/components/ProductImage";
import { ColorThemeShowcase } from "@/components/ColorThemeShowcase";
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
    'branco': '#FFFFFF',
    'white': '#FFFFFF',
    'preto': '#000000',
    'black': '#000000',
    'azul': '#0066CC',
    'blue': '#0066CC',
    'vermelho': '#CC0000',
    'red': '#CC0000',
    'verde': '#228B22',
    'green': '#228B22',
    'verde brasil': '#228B22',
    'amarelo': '#FFFF99',
    'yellow': '#FFFF99',
    'amarelo canário': '#FFFF99',
    'amarelo canario': '#FFFF99',
    'rosa': '#FF6699',
    'pink': '#FF6699',
    'roxo': '#9966CC',
    'purple': '#9966CC',
    'laranja': '#FF6600',
    'orange': '#FF6600',
    'marrom': '#996633',
    'brown': '#996633',
    'cinza': '#999999',
    'gray': '#999999',
    'grey': '#999999'
  };

  // Try to map by color name
  const colorName = color.name?.toLowerCase();
  if (colorName && colorMap[colorName]) {
    return colorMap[colorName];
  }

  // Default fallback
  return '#E5E7EB';
};

function Store() {
  // Authentication
  const { isAuthenticated, isApproved } = useCustomerAuth();

  // Navigation
  const navigate = useNavigate();

  // URL params for search
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get("busca") || "";
  const colorFilter = searchParams.get("cor") ? parseInt(searchParams.get("cor")!) : null;

  // Products with optimized hook
  const productsPerPage = 20;
  const { products, pagination, loading, error, fetchProducts, currentPage } = useProducts(productsPerPage);

  // Login modal
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Track selected variant image for each product
  const [selectedVariantImages, setSelectedVariantImages] = useState<Record<number, string>>({});

  // Handlers
  const handleProductClick = (productId: number) => {
    navigate(`/loja/produto/${productId}`);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= (pagination?.totalPages || 1)) {
      fetchProducts(newPage, searchTerm);
    }
  };

  const handleColorVariantClick = (productId: number, variantImageUrl: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the product modal
    setSelectedVariantImages(prev => ({
      ...prev,
      [productId]: variantImageUrl
    }));
  };

  // Effect to handle search term and color filter changes
  useEffect(() => {
    fetchProducts(1, searchTerm, colorFilter);
  }, [searchTerm, colorFilter, fetchProducts]);

  // Use all products since we removed filtering
  const filteredProducts = products;

  return (
    <StoreLayout>
      <div className="container mx-auto px-2 sm:px-4 lg:px-0 py-3 lg:py-4 space-y-3 lg:space-y-4 max-w-7xl">

        {/* Search Results Indicator */}
        {searchTerm && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">
                  Resultados para: <span className="text-primary">"{searchTerm}"</span>
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
                    Tente buscar por outras palavras como "chinelo", "adidas", "nike", etc.
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

        {/* Products Grid */}
        {!loading && filteredProducts.length > 0 && (
          <>
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
              {filteredProducts.map((product, index) => (
                <Card
                  key={product.id}
                  className="group cursor-pointer hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 relative border border-gray-200 hover:border-primary/40 rounded-xl overflow-hidden bg-white hover:-translate-y-1"
                  onClick={() => handleProductClick(product.id)}
                >
                  <CardContent className="p-0 relative">
                    {/* Product Image */}
                    <div className="aspect-square relative overflow-hidden bg-white">
                      <ProductImage
                        src={selectedVariantImages[product.id] || product.photo}
                        alt={product.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-all duration-300 p-3"
                        priority={index < 8}
                        loading={index < 8 ? "eager" : "lazy"}
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                      />

                      {/* Category Badge */}
                      {product.category_name && (
                        <Badge
                          variant="secondary"
                          className="absolute top-1.5 left-1.5 text-[10px] sm:text-xs bg-primary text-white px-1 sm:px-1.5 py-0.5 rounded-full shadow-md font-medium"
                        >
                          {product.category_name}
                        </Badge>
                      )}

                      {/* Variant Thumbnails */}
                      {product.available_colors &&
                        product.available_colors.length > 0 && (
                          <div className="absolute bottom-1.5 right-1.5">
                            <div className="flex gap-1">
                              {product.available_colors
                                .slice(0, 2)
                                .map((color) => (
                                  <div
                                    key={color.id}
                                    className="w-8 h-8 rounded-lg border-2 border-white cursor-pointer hover:scale-110 transition-all duration-200 shadow-lg overflow-hidden bg-gray-100"
                                    title={`${color.name}${color.hex_code ? ` (${color.hex_code})` : ''}`}
                                    onClick={(e) => color.image_url && handleColorVariantClick(product.id, color.image_url, e)}
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
                                        className="w-full h-full flex items-center justify-center text-[8px] font-bold text-white rounded-lg"
                                        style={{
                                          backgroundColor: getColorValue(color)
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

                    {/* Product Info */}
                    <div className="p-2.5 space-y-2">
                      <div>
                        <h3 className="font-medium text-base text-gray-900 line-clamp-2 leading-relaxed">
                          {product.name}
                        </h3>
                      </div>

                      {/* Pricing */}
                      {product.base_price && (
                        <div className="bg-gray-50 rounded-lg p-2">
                          <div className="space-y-0.5">
                            <div className="text-2xl font-bold text-primary">
                              R$ {Number(product.base_price).toFixed(2).replace('.', ',')}
                            </div>
                            {product.suggested_price && (
                              <div className="text-sm text-gray-500">
                                Sugerido: R$ {Number(product.suggested_price).toFixed(2).replace('.', ',')}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Add to Cart Button - Desktop only */}
                      {isAuthenticated && isApproved && (
                        <Button
                          className="w-full bg-primary hover:bg-primary/90 text-white text-base font-medium h-12 rounded-lg transition-all duration-200 hover:shadow-lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleProductClick(product.id);
                          }}
                        >
                          Adicionar ao Carrinho
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

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </StoreLayout>
  );
}

export default Store;
