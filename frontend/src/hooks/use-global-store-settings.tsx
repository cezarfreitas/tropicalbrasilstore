import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export interface StoreSettings {
  store_name?: string;
  store_logo?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  text_color?: string;
  background_color?: string;
  store_description?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  footer_text?: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  social_facebook?: string;
  social_instagram?: string;
  social_whatsapp?: string;
  enable_customer_registration?: boolean;
  enable_vendor_system?: boolean;
  maintenance_mode?: boolean;
  show_prices_to_guests?: boolean;
  minimum_order_value?: number;
  shipping_info?: string;
  payment_info?: string;
  terms_conditions?: string;
  privacy_policy?: string;
  return_policy?: string;
  currency_symbol?: string;
  currency_position?: "before" | "after";
  decimal_places?: number;
  thousands_separator?: string;
  decimal_separator?: string;
  timezone?: string;
  date_format?: string;
  time_format?: string;
  enable_analytics?: boolean;
  google_analytics_id?: string;
  facebook_pixel_id?: string;
  enable_chat?: boolean;
  chat_script?: string;
  custom_css?: string;
  custom_js?: string;
  header_scripts?: string;
  footer_scripts?: string;
  favicon_url?: string;
  apple_touch_icon_url?: string;
  enable_pwa?: boolean;
  pwa_name?: string;
  pwa_short_name?: string;
  pwa_description?: string;
  pwa_theme_color?: string;
  pwa_background_color?: string;
  enable_notifications?: boolean;
  notification_email?: string;
  smtp_host?: string;
  smtp_port?: number;
  smtp_username?: string;
  smtp_password?: string;
  smtp_secure?: boolean;
  enable_ssl?: boolean;
  ssl_redirect?: boolean;
  enable_gzip?: boolean;
  enable_caching?: boolean;
  cache_duration?: number;
  max_upload_size?: number;
  allowed_file_types?: string;
  enable_image_optimization?: boolean;
  image_quality?: number;
  max_image_width?: number;
  max_image_height?: number;
  watermark_enabled?: boolean;
  watermark_image?: string;
  watermark_position?: string;
  watermark_opacity?: number;
  backup_enabled?: boolean;
  backup_frequency?: string;
  backup_retention?: number;
  backup_storage?: string;
  created_at?: string;
  updated_at?: string;
}

export function useGlobalStoreSettings() {
  const { data: settings } = useQuery({
    queryKey: ["global-store-settings"],
    queryFn: async () => {
      try {
        const response = await api.get<{ success: boolean; data: StoreSettings }>("/api/settings");
        return response.data;
      } catch (error) {
        console.error("Failed to fetch store settings:", error);
        // Return default settings on error
        return {
          store_name: "Chinelos Store",
          primary_color: "#1d4ed8",
          secondary_color: "#64748b",
          accent_color: "#f59e0b",
          text_color: "#1f2937",
          background_color: "#ffffff",
          currency_symbol: "R$",
          currency_position: "before" as const,
          decimal_places: 2,
          thousands_separator: ".",
          decimal_separator: ",",
          show_prices_to_guests: true,
          enable_customer_registration: true,
          enable_vendor_system: true,
          maintenance_mode: false,
        } as StoreSettings;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });

  return settings;
}
