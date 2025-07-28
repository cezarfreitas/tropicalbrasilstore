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

function Store() {
  // Authentication
  const { isAuthenticated, isApproved } = useCustomerAuth();

  // Navigation
  const navigate = useNavigate();

  // URL params for search
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get("busca") || "";

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

  // Effect to handle search term changes
  useEffect(() => {
    fetchProducts(1, searchTerm);
  }, [searchTerm, fetchProducts]);

  // Use all products since we removed filtering
  const filteredProducts = products;

  return (
    <StoreLayout>
      <div className="container mx-auto lg:px-0 px-4 py-6 space-y-6">

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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
              {filteredProducts.map((product, index) => (
                <Card
                  key={product.id}
                  className="group cursor-pointer hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 relative border-2 border-transparent hover:border-primary/30 rounded-2xl overflow-hidden bg-gradient-to-b from-white to-primary/5 hover:to-primary/10 hover:-translate-y-1"
                  onClick={() => handleProductClick(product.id)}
                >
                  <CardContent className="p-0 relative">
                    {/* Product Image */}
                    <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-primary/5 to-primary/10">
                      <div className="absolute inset-0 bg-white/50 group-hover:bg-white/30 transition-colors duration-300"></div>
                      <ProductImage
                        src={selectedVariantImages[product.id] || product.photo}
                        alt={product.name}
                        className="w-full h-full object-contain group-hover:scale-110 transition-all duration-500 relative z-10 p-4"
                        priority={index < 8}
                        loading={index < 8 ? "eager" : "lazy"}
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                      />

                      {/* Category Badge */}
                      {product.category_name && (
                        <Badge
                          variant="secondary"
                          className="absolute top-3 left-3 text-[10px] sm:text-xs bg-primary/90 text-white backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-1.5 border border-primary/20 rounded-full shadow-lg font-medium"
                        >
                          {product.category_name}
                        </Badge>
                      )}

                      {/* Colors - Available on all devices */}
                      {product.available_colors &&
                        product.available_colors.length > 0 && (
                          <div className="absolute bottom-3 right-3">
                            <div className="flex gap-1.5 bg-white/95 backdrop-blur-sm rounded-xl p-2 shadow-lg border border-white/50">
                              {product.available_colors
                                .slice(0, 3)
                                .map((color) => (
                                  <div
                                    key={color.id}
                                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 border-white overflow-hidden bg-white cursor-pointer hover:scale-125 transition-all duration-200 shadow-md"
                                    title={color.name}
                                    onClick={(e) => color.image_url && handleColorVariantClick(product.id, color.image_url, e)}
                                  >
                                    {color.image_url ? (
                                      <ProductImage
                                        src={color.image_url}
                                        alt={`${product.name} - ${color.name}`}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div
                                        className="w-full h-full flex items-center justify-center text-[8px] sm:text-[10px] font-bold text-white"
                                        style={{ backgroundColor: color.hex_code }}
                                      >
                                        {color.name?.charAt(0)}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              {product.available_colors.length > 3 && (
                                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center shadow-md">
                                  <span className="text-[8px] sm:text-[10px] text-gray-600 font-bold">
                                    +{product.available_colors.length - 3}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                    </div>

                    {/* Product Info */}
                    <div className="p-4 sm:p-5 space-y-3 bg-white/50 backdrop-blur-sm">
                      <div className="space-y-2">
                        <h3 className="font-semibold text-sm sm:text-base text-foreground line-clamp-2 group-hover:text-primary transition-colors duration-200 leading-tight">
                          {product.name}
                        </h3>
                      </div>

                      {/* Pricing */}
                      {product.base_price && (
                        <div className="space-y-2">
                          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-3 border border-primary/20">
                            <PriceDisplay
                              price={product.base_price}
                              suggestedPrice={product.suggested_price}
                              variant="default"
                              onLoginClick={() => setShowLoginModal(true)}
                            />
                          </div>
                        </div>
                      )}

                      {/* Add to Cart Button - Desktop only */}
                      {isAuthenticated && isApproved && (
                        <Button
                          className="hidden sm:flex w-full mt-3 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground text-sm h-10 transition-all duration-300 hover:shadow-lg hover:shadow-primary/30 rounded-xl font-medium"
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
                        className="sm:hidden absolute bottom-4 right-4 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 rounded-full p-3 shadow-xl transition-all duration-300 active:scale-95 border-2 border-white hover:shadow-primary/30"
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
