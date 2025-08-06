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
    image_url?: string;
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
  fetchProducts: (
    page?: number,
    searchTerm?: string,
    colorFilter?: number | null,
    categoryFilter?: string | null,
    genderFilter?: number | null,
    typeFilter?: number | null,
  ) => Promise<void>;
  currentPage: number;
}

// Global cache to persist between component unmounts
const globalCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Utility to check if HMR WebSocket is ready
const isHMRReady = () => {
  if (typeof window === "undefined" || !import.meta.hot) {
    return true; // No HMR in production
  }

  try {
    // Check if HMR client is properly connected
    const hmrClient = (window as any).__vite_hmr_client;
    return hmrClient?.ws?.readyState === WebSocket.OPEN;
  } catch {
    return false;
  }
};

// HMR guard to prevent connection issues
if (typeof window !== "undefined" && import.meta.hot) {
  import.meta.hot.accept(() => {
    // Mark HMR as in progress
    if (import.meta.hot?.data) {
      import.meta.hot.data.hmrInvalidated = true;
    }
    // Clear cache on HMR to prevent stale data
    globalCache.clear();
    // Reset flag after a short delay
    setTimeout(() => {
      if (import.meta.hot?.data) {
        import.meta.hot.data.hmrInvalidated = false;
      }
    }, 100);
  });
}

// Custom fetch using XMLHttpRequest to completely avoid FullStory conflicts
const customFetch = async (
  url: string,
  options?: RequestInit,
): Promise<Response> => {
  // HMR guard to prevent issues during development
  if (import.meta.hot?.data?.hmrInvalidated) {
    throw new Error("HMR invalidation in progress");
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const method = options?.method || "GET";

    xhr.open(method, url);

    // Handle credentials
    if (options?.credentials === "include") {
      xhr.withCredentials = true;
    } else if (options?.credentials === "same-origin") {
      // Same-origin is the default for XMLHttpRequest
      xhr.withCredentials = true;
    }

    // Set headers
    if (options?.headers) {
      const headers = options.headers as Record<string, string>;
      Object.entries(headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });
    }

    // Handle abort signal
    if (options?.signal) {
      options.signal.addEventListener("abort", () => {
        xhr.abort();
        reject(new Error("Request aborted"));
      });
    }

    xhr.onload = () => {
      // Parse response headers
      const responseHeaders: Record<string, string> = {};
      const headerText = xhr.getAllResponseHeaders();
      if (headerText) {
        headerText.split("\r\n").forEach((line) => {
          const parts = line.split(": ");
          if (parts.length === 2) {
            responseHeaders[parts[0].toLowerCase()] = parts[1];
          }
        });
      }

      const response = new Response(xhr.responseText, {
        status: xhr.status,
        statusText: xhr.statusText,
        headers: new Headers(responseHeaders),
      });

      resolve(response);
    };

    xhr.onerror = () => {
      reject(new Error("Network request failed"));
    };

    xhr.ontimeout = () => {
      reject(new Error("Request timeout"));
    };

    // Set timeout if needed
    if (options?.signal) {
      xhr.timeout = 15000; // 15 second timeout
    }

    xhr.send(options?.body || null);
  });
};

export function useProducts(productsPerPage: number = 20): UseProductsResult {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentSearchTerm, setCurrentSearchTerm] = useState<string>("");
  const [isRequestInProgress, setIsRequestInProgress] = useState(false);

  const fetchProducts = useCallback(
    async (
      page: number = 1,
      retryCount: number = 0,
      searchTerm: string = "",
      colorFilter: number | null = null,
      categoryFilter: string | null = null,
      genderFilter: number | null = null,
      typeFilter: number | null = null,
    ) => {
      // Prevent multiple concurrent requests
      if (isRequestInProgress && retryCount === 0) {
        console.log("⏸️ Request already in progress, skipping duplicate call");
        return;
      }

      setIsRequestInProgress(true);
      const cacheKey = `products-v8-${page}-${productsPerPage}-${searchTerm}-${colorFilter || "all"}-${categoryFilter || "all"}-${genderFilter || "all"}-${typeFilter || "all"}`; // v8 to force cache invalidation

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
        setIsRequestInProgress(false);
        return;
      }

      console.log(
        `🚀 Fetching products - page: ${page}${retryCount > 0 ? ` (retry ${retryCount})` : ""}`,
      );
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: productsPerPage.toString(),
          _t: Date.now().toString(), // Cache busting
        });

        if (searchTerm.trim()) {
          params.append("busca", searchTerm.trim());
        }

        if (colorFilter !== null) {
          params.append("cor", colorFilter.toString());
        }

        if (categoryFilter !== null && categoryFilter.trim()) {
          params.append("categoria", categoryFilter.trim());
        }

        if (genderFilter !== null) {
          params.append("genero", genderFilter.toString());
        }

        if (typeFilter !== null) {
          params.append("tipo", typeFilter.toString());
        }

        const endpoint = `/api/store/products-paginated?${params}`;


        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // Increased timeout

        let response;
        try {
          response = await customFetch(endpoint, {
            method: "GET",
            signal: controller.signal,
            mode: "cors",
            credentials: "same-origin",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              "Cache-Control": "public, max-age=300",
            },
          });

          clearTimeout(timeoutId);
        } catch (fetchError) {
          clearTimeout(timeoutId);
          console.warn(`Primary fetch failed: ${fetchError}`, {
            endpoint,
            searchTerm,
            page,
            error:
              fetchError instanceof Error
                ? fetchError.message
                : String(fetchError),
          });

          // Skip the old fallback endpoint since it doesn't exist
          console.log("Skipping non-existent fallback endpoint");

          // Try a simplified request as last resort
          try {
            console.log("🔧 Trying simplified fetch...");
            let basicUrl = `/api/store/products-paginated?page=${page}&limit=${productsPerPage}`;
            if (searchTerm && searchTerm.trim()) {
              basicUrl += `&busca=${encodeURIComponent(searchTerm.trim())}`;
            }
            console.log(`🔧 Basic fetch URL: ${basicUrl}`);

            // Use a simpler fetch without timeout for last resort
            const basicResponse = await customFetch(basicUrl, {
              method: "GET",
              cache: "no-cache",
            });

            if (basicResponse.ok) {
              const data = await basicResponse.json();
              console.log(
                `✅ Basic fetch success: ${data.products?.length || 0} products${searchTerm ? ` for search: "${searchTerm}"` : ""}`,
              );

              setProducts(data.products || []);
              setPagination(data.pagination || null);
              setCurrentPage(page);
              setCurrentSearchTerm(searchTerm);
              setError(null);
              setLoading(false);
              setIsRequestInProgress(false);
              return;
            } else {
              console.error(
                `Basic fetch failed with status: ${basicResponse.status}`,
              );
            }
          } catch (basicError) {
            console.error("Basic fetch also failed:", basicError);
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
          timestamp: Date.now(),
        });

        setProducts(data.products || []);
        setPagination(data.pagination || null);
        setCurrentPage(page);
        setCurrentSearchTerm(searchTerm);
        setError(null);
        setIsRequestInProgress(false);
      } catch (err: any) {
        console.error("Error fetching products:", err);

        // Skip processing if HMR invalidation is in progress
        if (err.message?.includes("HMR invalidation")) {
          console.log("🔄 Skipping fetch due to HMR invalidation");
          setIsRequestInProgress(false);
          return;
        }

        // Retry logic for network failures
        if (
          retryCount < 2 &&
          (err.message.includes("Failed to fetch") ||
            err.message.includes("Network") ||
            err.name === "AbortError")
        ) {
          console.log(`🔄 Retrying fetch... (attempt ${retryCount + 1}/3)`);
          setTimeout(
            () => {
              fetchProducts(
                page,
                retryCount + 1,
                searchTerm,
                colorFilter,
                categoryFilter,
                genderFilter,
                typeFilter,
              );
            },
            1000 * (retryCount + 1),
          ); // Exponential backoff
          return;
        }

        let errorMessage = "Erro de conexão. Tente novamente.";
        if (err instanceof Error) {
          if (err.name === "AbortError" || err.message.includes("timeout")) {
            errorMessage = "⏱️ Tempo limite esgotado. Verifique sua conexão.";
          } else if (err.message.includes("Failed to fetch")) {
            errorMessage =
              "🌐 Erro de rede. Verifique se você está conectado à internet.";
          } else if (
            err.message.includes("Network") ||
            err.message.includes("network")
          ) {
            errorMessage =
              "🌐 Erro de rede. Verifique sua conexão com a internet.";
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
        setIsRequestInProgress(false);
      }
    },
    [productsPerPage, isRequestInProgress],
  );

  // Initial fetch
  useEffect(() => {
    // Skip initial fetch during HMR to prevent connection issues
    if (import.meta.hot?.data?.hmrInvalidated || !isHMRReady()) {
      // Retry after a short delay if HMR is not ready
      const timer = setTimeout(() => {
        if (isHMRReady()) {
          fetchProducts(1);
        }
      }, 200);
      return () => clearTimeout(timer);
    }
    fetchProducts(1);
  }, [fetchProducts]);

  // Wrapper function to maintain API compatibility
  const fetchProductsWrapper = useCallback(
    (
      page: number = 1,
      searchTerm: string = "",
      colorFilter: number | null = null,
      categoryFilter: string | null = null,
      genderFilter: number | null = null,
      typeFilter: number | null = null,
    ) => {
      return fetchProducts(
        page,
        0,
        searchTerm,
        colorFilter,
        categoryFilter,
        genderFilter,
        typeFilter,
      ); // Always start with retry count 0
    },
    [fetchProducts],
  );

  return {
    products,
    pagination,
    loading,
    error,
    fetchProducts: fetchProductsWrapper,
    currentPage,
  };
}
