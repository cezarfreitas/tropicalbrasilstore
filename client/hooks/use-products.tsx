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
  fetchProducts: (page?: number, searchTerm?: string) => Promise<void>;
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
  const [currentSearchTerm, setCurrentSearchTerm] = useState<string>("");

  const fetchProducts = useCallback(async (page: number = 1, retryCount: number = 0, searchTerm: string = "") => {
    const cacheKey = `products-${page}-${productsPerPage}-${searchTerm}`;

    // Check cache first
    const cached = globalCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`📦 Using cached products for page ${page}`);
      setProducts(cached.data.products || []);
      setPagination(cached.data.pagination || null);
      setCurrentPage(page);
      setCurrentSearchTerm(searchTerm);
      setError(null);
      setLoading(false);
      return;
    }

    console.log(`🚀 Fetching products - page: ${page}${retryCount > 0 ? ` (retry ${retryCount})` : ''}`);
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: productsPerPage.toString(),
      });

      if (searchTerm.trim()) {
        params.append("busca", searchTerm.trim());
      }

      const endpoint = `/api/store/products-paginated?${params}`;

      // Debug log
      console.log(`🔍 Client making request to: ${endpoint}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      let response;
      try {
        response = await fetch(endpoint, {
          method: 'GET',
          signal: controller.signal,
          mode: 'cors',
          credentials: 'same-origin',
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=300",
          },
        });

        clearTimeout(timeoutId);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        console.warn(`Primary fetch failed: ${fetchError}`);

        // Try fallback endpoint immediately
        try {
          const fallbackEndpoint = `/api/store-old/products-paginated?${params}`;
          console.log(`🔄 Trying fallback: ${fallbackEndpoint}`);

          const fallbackController = new AbortController();
          const fallbackTimeoutId = setTimeout(() => fallbackController.abort(), 8000);

          const fallbackResponse = await fetch(fallbackEndpoint, {
            method: 'GET',
            signal: fallbackController.signal,
            mode: 'cors',
            credentials: 'same-origin',
            headers: {
              "Accept": "application/json",
              "Content-Type": "application/json"
            },
          });

          clearTimeout(fallbackTimeoutId);

          if (fallbackResponse.ok) {
            const data = await fallbackResponse.json();
            console.log(`✅ Fallback success: ${data.products?.length || 0} products`);

            setProducts(data.products || []);
            setPagination(data.pagination || null);
            setCurrentPage(page);
            setCurrentSearchTerm(searchTerm);
            setError(null);
            setLoading(false);
            return;
          }
        } catch (fallbackError) {
          console.warn("Fallback also failed:", fallbackError);
        }

        // If both primary and fallback fail, try one more time with simplified request
        try {
          console.log("🔧 Trying basic fetch without complex headers...");
          let basicUrl = `/api/store/products-paginated?page=${page}&limit=${productsPerPage}`;
          if (searchTerm && searchTerm.trim()) {
            basicUrl += `&busca=${encodeURIComponent(searchTerm.trim())}`;
          }
          console.log(`🔧 Basic fetch URL: ${basicUrl}`);

          const basicResponse = await fetch(basicUrl, {
            method: 'GET'
          });

          if (basicResponse.ok) {
            const data = await basicResponse.json();
            console.log(`✅ Basic fetch success: ${data.products?.length || 0} products${searchTerm ? ` for search: "${searchTerm}"` : ''}`);

            setProducts(data.products || []);
            setPagination(data.pagination || null);
            setCurrentPage(page);
            setCurrentSearchTerm(searchTerm);
            setError(null);
            setLoading(false);
            return;
          }
        } catch (basicError) {
          console.warn("Basic fetch also failed:", basicError);
        }

        // If all methods fail, throw original error
        throw fetchError;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
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
      setCurrentSearchTerm(searchTerm);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching products:", err);

      // Retry logic for network failures
      if (retryCount < 2 && (
        err.message.includes("Failed to fetch") ||
        err.message.includes("Network") ||
        err.name === "AbortError"
      )) {
        console.log(`🔄 Retrying fetch... (attempt ${retryCount + 1}/3)`);
        setTimeout(() => {
          fetchProducts(page, retryCount + 1, searchTerm);
        }, 1000 * (retryCount + 1)); // Exponential backoff
        return;
      }

      let errorMessage = "Erro de conexão. Tente novamente.";
      if (err instanceof Error) {
        if (err.name === "AbortError" || err.message.includes("timeout")) {
          errorMessage = "⏱️ Tempo limite esgotado. Verifique sua conexão.";
        } else if (err.message.includes("Failed to fetch")) {
          errorMessage = "🌐 Erro de rede. Verifique se você está conectado à internet.";
        } else if (err.message.includes("Network") || err.message.includes("network")) {
          errorMessage = "🌐 Erro de rede. Verifique sua conexão com a internet.";
        } else if (err.message.includes("CORS")) {
          errorMessage = "🔒 Erro de segurança. Recarregue a página.";
        } else if (err.message.includes("HTTP")) {
          errorMessage = `📡 Erro do servidor: ${err.message}`;
        } else {
          errorMessage = `❌ Erro inesperado: ${err.message}`;
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

  // Wrapper function to maintain API compatibility
  const fetchProductsWrapper = useCallback((page: number = 1, searchTerm: string = "") => {
    return fetchProducts(page, 0, searchTerm); // Always start with retry count 0
  }, [fetchProducts]);

  return {
    products,
    pagination,
    loading,
    error,
    fetchProducts: fetchProductsWrapper,
    currentPage,
  };
}
