import { API_CONFIG, buildApiUrl } from "@/config/api";

// Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
}

// Custom Error Class
export class ApiClientError extends Error {
  public status: number;
  public code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
  }
}

// HTTP Client Class
export class ApiClient {
  private baseURL: string;
  private timeout: number;
  private defaultHeaders: Record<string, string>;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
    this.defaultHeaders = {
      "Content-Type": "application/json",
    };
  }

  // Set authorization token
  setAuthToken(token: string | null) {
    if (token) {
      this.defaultHeaders["Authorization"] = `Bearer ${token}`;
    } else {
      delete this.defaultHeaders["Authorization"];
    }
  }

  // Generic request method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = buildApiUrl(endpoint);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.defaultHeaders,
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle non-JSON responses
      const contentType = response.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        if (!response.ok) {
          throw new ApiClientError(
            `HTTP ${response.status}: ${response.statusText}`,
            response.status,
          );
        }
        return response as unknown as T;
      }

      const data = await response.json();

      if (!response.ok) {
        const errorMessage =
          data.message || data.error || `HTTP ${response.status}`;
        throw new ApiClientError(errorMessage, response.status, data.code);
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof ApiClientError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new ApiClientError("Request timeout", 408, "TIMEOUT");
        }
        throw new ApiClientError(
          error.message || "Network error",
          0,
          "NETWORK_ERROR",
        );
      }

      throw new ApiClientError("Unknown error", 0, "UNKNOWN_ERROR");
    }
  }

  // HTTP Methods
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(buildApiUrl(endpoint));
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return this.request<T>(url.pathname + url.search, {
      method: "GET",
    });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: "DELETE",
    });
  }

  // File upload method
  async uploadFile<T>(endpoint: string, formData: FormData): Promise<T> {
    const headers = { ...this.defaultHeaders };
    delete headers["Content-Type"]; // Let browser set multipart/form-data

    return this.request<T>(endpoint, {
      method: "POST",
      headers,
      body: formData,
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export convenience methods
export const api = {
  get: <T>(endpoint: string, params?: Record<string, any>) =>
    apiClient.get<T>(endpoint, params),
  post: <T>(endpoint: string, data?: any) => apiClient.post<T>(endpoint, data),
  put: <T>(endpoint: string, data?: any) => apiClient.put<T>(endpoint, data),
  patch: <T>(endpoint: string, data?: any) =>
    apiClient.patch<T>(endpoint, data),
  delete: <T>(endpoint: string) => apiClient.delete<T>(endpoint),
  upload: <T>(endpoint: string, formData: FormData) =>
    apiClient.uploadFile<T>(endpoint, formData),
};
