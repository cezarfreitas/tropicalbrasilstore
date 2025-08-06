import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { StoreLayout } from "@/components/StoreLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProductSkeleton } from "@/components/ProductSkeleton";
import { SimpleProductCard } from "@/components/SimpleProductCard";
import { useCustomerAuth } from "@/hooks/use-customer-auth";
import { useProducts } from "@/hooks/use-products";
import { LoginModal } from "@/components/LoginModal";
import { DynamicTitle } from "@/components/DynamicTitle";
import {
  Package,
  AlertCircle,
  Search,
  ArrowUpDown,
  Grid3X3,
  Grid2X2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  // Sorting state
  const [sortBy, setSortBy] = useState("name-asc");

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

  // Sort products based on selected option
  const sortProducts = (products: any[], sortBy: string) => {
    if (!products || products.length === 0) return products;

    const sorted = [...products];

    switch (sortBy) {
      case "name-asc":
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case "name-desc":
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      case "price-asc":
        return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
      case "price-desc":
        return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
      case "newest":
        return sorted.sort(
          (a, b) =>
            new Date(b.created_at || 0).getTime() -
            new Date(a.created_at || 0).getTime(),
        );
      default:
        return sorted;
    }
  };

  // Use all products with sorting applied
  const filteredProducts = sortProducts(products, sortBy);

  return (
    <StoreLayout>
      <DynamicTitle />
      <div className="w-full px-4 lg:px-6 py-3 lg:py-4 space-y-3 lg:space-y-4">
        {/* Product Count and Sorting */}
        {!loading && !error && (
          <div className="flex items-center justify-between bg-white border rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-gray-700">
                {filteredProducts.length > 0 ? (
                  <>
                    {pagination ? (
                      <>
                        <span className="text-primary font-semibold">
                          {filteredProducts.length}
                        </span>{" "}
                        de{" "}
                        <span className="text-primary font-semibold">
                          {pagination.totalItems}
                        </span>{" "}
                        produtos
                      </>
                    ) : (
                      <>
                        <span className="text-primary font-semibold">
                          {filteredProducts.length}
                        </span>{" "}
                        produtos encontrados
                      </>
                    )}
                  </>
                ) : (
                  "Nenhum produto encontrado"
                )}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Sort Options */}
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-gray-500" />
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[140px] h-8">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name-asc">Nome A-Z</SelectItem>
                    <SelectItem value="name-desc">Nome Z-A</SelectItem>
                    <SelectItem value="price-asc">Menor preço</SelectItem>
                    <SelectItem value="price-desc">Maior preço</SelectItem>
                    <SelectItem value="newest">Mais recentes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* View Toggle */}
              <div className="hidden sm:flex items-center border rounded-md">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 border-r rounded-r-none"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-l-none bg-primary/10"
                >
                  <Grid2X2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

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

        {/* Products Grid - Optimized for square photos */}
        {!loading && filteredProducts.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-5 lg:gap-6">
              {filteredProducts.map((product, index) => (
                <SimpleProductCard
                  key={product.id}
                  product={product}
                  onProductClick={handleProductClick}
                  onLoginClick={() => setShowLoginModal(true)}
                  isAuthenticated={isAuthenticated}
                  isApproved={isApproved}
                  index={index}
                />
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
