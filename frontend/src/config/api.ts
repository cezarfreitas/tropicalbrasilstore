// API Configuration for Frontend
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/api/auth/login',
  LOGOUT: '/api/auth/logout',
  VERIFY: '/api/auth/verify',
  
  // Customer Auth
  CUSTOMER_LOGIN: '/api/customers/login',
  CUSTOMER_REGISTER: '/api/customers/register',
  CUSTOMER_VERIFY: '/api/customers/verify',
  
  // Vendor Auth
  VENDOR_LOGIN: '/api/vendor/login',
  VENDOR_LOGOUT: '/api/vendor/logout',
  VENDOR_PROFILE: '/api/vendor/profile',
  VENDOR_DASHBOARD: '/api/vendor/dashboard',
  
  // Products
  PRODUCTS: '/api/products',
  PRODUCTS_BULK: '/api/products/bulk',
  PRODUCTS_ENHANCED: '/api/products-enhanced',
  PRODUCTS_WOOCOMMERCE: '/api/products-woocommerce',
  
  // Store
  STORE: '/api/store',
  STORE_SIMPLE: '/api/store-simple',
  STORE_CATEGORIES: '/api/store/categories',
  
  // Settings
  SETTINGS: '/api/settings',
  
  // Categories, Colors, Sizes, etc.
  CATEGORIES: '/api/categories',
  COLORS: '/api/colors',
  SIZES: '/api/sizes',
  SIZE_GROUPS: '/api/size-groups',
  GENDERS: '/api/genders',
  TYPES: '/api/types',
  BRANDS: '/api/brands',
  GRADES: '/api/grades',
  
  // Orders
  ORDERS: '/api/orders',
  ADMIN_ORDERS: '/api/admin/orders',
  CUSTOMER_ORDERS: '/api/customer/orders',
  VENDOR_ORDERS: '/api/vendor/orders',
  
  // Customers
  CUSTOMERS: '/api/customers',
  ADMIN_CUSTOMERS: '/api/admin/customers',
  VENDOR_CUSTOMERS: '/api/vendor/customers',
  
  // Vendors
  VENDORS: '/api/vendors',
  VENDOR_REFERRAL: '/api/vendor/referral',
  
  // Upload
  UPLOAD: '/api/upload',
  
  // Notifications
  NOTIFICATIONS: '/api/notifications',
  
  // Stats
  STATS: '/api/stats',
  
  // Utils
  PING: '/api/ping',
  HEALTH: '/health',
  DEBUG_STATUS: '/debug/status',
} as const;

// Helper function to build full URL
export function buildApiUrl(endpoint: string): string {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
}

// Helper function to get API key from environment
export function getApiKey(): string | undefined {
  return import.meta.env.VITE_API_KEY;
}
