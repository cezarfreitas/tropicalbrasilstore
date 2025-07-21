import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { StoreLayout } from '@/components/StoreLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProductModal } from '@/components/ProductModal';
import { ProductImage } from '@/components/ProductImage';
import { Package, AlertCircle } from 'lucide-react';

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
  // State
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const productsPerPage = 20;
  
  // Modal
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);

  // Fetch products function
  const fetchProducts = async (page: number = 1, retryCount: number = 0) => {
    console.log(`Fetching products - page: ${page}, retry: ${retryCount}`);
    console.log(`Current location: ${window.location.origin}`);

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

      // Try to use native fetch first, then XMLHttpRequest as fallback
      const fetchFunction = window.fetch && typeof window.fetch === 'function' ? window.fetch : undefined;

      if (!fetchFunction) {
        throw new Error('Fetch API not available');
      }

      for (const endpoint of endpoints) {
        try {
          console.log(`Trying endpoint: ${endpoint}`);
          response = await fetchFunction(endpoint, {
            headers: {
              'Accept': 'application/json',
            },
          });

          if (response.ok) {
            console.log(`Success with endpoint: ${endpoint}`);
            break;
          } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        } catch (err) {
          console.warn(`Failed endpoint ${endpoint}:`, err);
          console.warn(`Error details:`, {
            name: (err as Error).name,
            message: (err as Error).message,
            stack: (err as Error).stack
          });
          lastError = err as Error;
          response = null;
        }
      }

      if (!response || !response.ok) {
        throw lastError || new Error('All endpoints failed');
      }

      const data = await response.json();
      console.log(`Fetched ${data.products?.length || 0} products`);

      setProducts(data.products || []);
      setPagination(data.pagination || null);
      setCurrentPage(page);
      setError(null);

    } catch (err: any) {
      console.error('Error fetching products:', err);

      // Retry logic for network errors
      if (retryCount < 2 && (err.name === 'TypeError' || err.message?.includes('Failed to fetch'))) {
        console.log(`Retrying... (attempt ${retryCount + 1})`);
        setTimeout(() => fetchProducts(page, retryCount + 1), 1000);
        return;
      }

      // Set error state
      const errorMessage = err.message || 'Erro ao carregar produtos';
      console.error('Final error:', errorMessage);
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
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
            Loja de Chinelos
          </h1>
          <p className="text-slate-600 mt-1">
            {pagination ? `${pagination.totalProducts} produtos disponíveis` : 'Carregando produtos...'}
          </p>
        </div>

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-red-900 font-medium">Erro ao carregar produtos</p>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
                <Button onClick={handleRefresh} variant="outline" size="sm" className="ml-auto">
                  Tentar Novamente
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-slate-600 mt-2">Carregando produtos...</p>
            </div>
          </div>
        )}

        {/* Products Grid */}
        {!loading && filteredProducts.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {filteredProducts.map((product) => (
                <Card 
                  key={product.id} 
                  className="group cursor-pointer hover:shadow-lg transition-shadow duration-200"
                  onClick={() => handleProductClick(product.id)}
                >
                  <CardContent className="p-0">
                    {/* Product Image */}
                    <div className="aspect-square relative overflow-hidden rounded-t-lg">
                      <ProductImage
                        src={product.photo}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      
                      {/* Category Badge */}
                      {product.category_name && (
                        <Badge
                          variant="secondary"
                          className="absolute top-1 left-1 sm:top-2 sm:left-2 text-xs bg-white/90 backdrop-blur-sm"
                        >
                          {product.category_name}
                        </Badge>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-2 sm:p-4 space-y-2 sm:space-y-3">
                      <div>
                        <h3 className="font-medium text-xs sm:text-sm text-slate-900 line-clamp-1 group-hover:text-primary transition-colors">
                          {product.name}
                        </h3>
                      </div>

                      {/* Pricing */}
                      {product.base_price && (
                        <div className="space-y-1">
                          <div className="text-sm sm:text-lg font-bold text-primary">
                            R$ {parseFloat(product.base_price.toString()).toFixed(2)}
                          </div>
                          {product.suggested_price && (
                            <div className="text-xs text-muted-foreground line-through">
                              Sugerido: R$ {parseFloat(product.suggested_price.toString()).toFixed(2)}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Colors */}
                      {product.available_colors && product.available_colors.length > 0 && (
                        <div className="flex items-center gap-1 sm:gap-2">
                          <span className="text-xs text-slate-600 hidden sm:inline">Cores:</span>
                          <div className="flex gap-1">
                            {product.available_colors.slice(0, 5).map((color) => (
                              <div
                                key={color.id}
                                className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border border-slate-300"
                                style={{ backgroundColor: color.hex_code || '#999' }}
                                title={color.name}
                              />
                            ))}
                            {product.available_colors.length > 5 && (
                              <span className="text-xs text-slate-500">+{product.available_colors.length - 5}</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Add to Cart Button */}
                      <Button
                        className="w-full mt-2 bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProductClick(product.id);
                        }}
                      >
                        Adicionar ao Carrinho
                      </Button>
                    </div>
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
                  {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                    const page = i + 1;
                    return (
                      <Button
                        key={page}
                        variant={page === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </Button>
                    );
                  })}
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
            <Package className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Nenhum produto encontrado
            </h3>
            <p className="text-slate-600 mb-4">
              Não há produtos disponíveis no momento
            </p>
          </div>
        )}
      </div>

      {/* Product Modal */}
      <ProductModal
        productId={selectedProductId}
        isOpen={showProductModal}
        onClose={handleCloseModal}
      />
    </StoreLayout>
  );
}

export default Store;
