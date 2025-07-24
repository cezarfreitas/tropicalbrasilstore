import { useState, useEffect, useCallback } from "react";

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

interface UseProductsResult {
  products: StoreProduct[];
  pagination: PaginationInfo | null;
  loading: boolean;
  error: string | null;
  fetchProducts: (page?: number) => Promise<void>;
  currentPage: number;
}

// Global cache to persist between component unmounts
const globalCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useProducts(productsPerPage: number = 20): UseProductsResult {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchProducts = useCallback(async (page: number = 1) => {
    const cacheKey = `products-${page}-${productsPerPage}`;
    
    // Check cache first
    const cached = globalCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`📦 Using cached products for page ${page}`);
      setProducts(cached.data.products || []);
      setPagination(cached.data.pagination || null);
      setCurrentPage(page);
      setError(null);
      setLoading(false);
      return;
    }

    console.log(`🚀 Fetching products - page: ${page}`);
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: productsPerPage.toString(),
      });

      const endpoint = `/api/store/products-paginated?${params}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(endpoint, {
        signal: controller.signal,
        headers: {
          "Accept": "application/json",
          "Cache-Control": "public, max-age=300",
        },
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        // Try fallback endpoint
        const fallbackEndpoint = `/api/store-old/products-paginated?${params}`;
        const fallbackResponse = await fetch(fallbackEndpoint, {
          headers: { "Accept": "application/json" },
        });
        
        if (!fallbackResponse.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await fallbackResponse.json();
        console.log(`✅ Fallback success: ${data.products?.length || 0} products`);
        
        setProducts(data.products || []);
        setPagination(data.pagination || null);
        setCurrentPage(page);
        setError(null);
        return;
      }

      const data = await response.json();
      console.log(`✅ Fetched ${data.products?.length || 0} products`);

      // Cache the response
      globalCache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      setProducts(data.products || []);
      setPagination(data.pagination || null);
      setCurrentPage(page);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching products:", err);
      
      let errorMessage = "Erro de conexão. Tente novamente.";
      if (err instanceof Error) {
        if (err.name === "AbortError" || err.message.includes("timeout")) {
          errorMessage = "⏱️ Tempo limite esgotado. Verifique sua conexão.";
        } else if (err.message.includes("Network") || err.message.includes("network")) {
          errorMessage = "🌐 Erro de rede. Verifique sua conexão com a internet.";
        }
      }

      setError(errorMessage);
      setProducts([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [productsPerPage]);

  // Initial fetch
  useEffect(() => {
    fetchProducts(1);
  }, [fetchProducts]);

  return {
    products,
    pagination,
    loading,
    error,
    fetchProducts,
    currentPage,
  };
}
