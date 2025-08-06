import { useState, useEffect } from 'react';

interface StoreSettings {
  store_name?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  background_color?: string;
  text_color?: string;
  minimum_order_value?: number;
}

// Declare global variable
declare global {
  interface Window {
    __STORE_SETTINGS__?: StoreSettings | null;
  }
}

export function useGlobalStoreSettings() {
  const [settings, setSettings] = useState<StoreSettings | null>(() => {
    // Try to get settings immediately from global variable
    if (typeof window !== 'undefined' && window.__STORE_SETTINGS__) {
      return window.__STORE_SETTINGS__;
    }
    return null;
  });

  useEffect(() => {
    // Set initial settings if available
    if (window.__STORE_SETTINGS__) {
      setSettings(window.__STORE_SETTINGS__);
    }

    // Listen for when settings are loaded
    const handleSettingsLoaded = (event: CustomEvent) => {
      setSettings(event.detail);
    };

    // Listen for settings updates
    const handleSettingsUpdate = () => {
      if (window.__STORE_SETTINGS__) {
        setSettings(window.__STORE_SETTINGS__);
      }
    };

    window.addEventListener('storeSettingsLoaded', handleSettingsLoaded as EventListener);
    window.addEventListener('settingsRefresh', handleSettingsUpdate);
    window.addEventListener('themeRefresh', handleSettingsUpdate);

    return () => {
      window.removeEventListener('storeSettingsLoaded', handleSettingsLoaded as EventListener);
      window.removeEventListener('settingsRefresh', handleSettingsUpdate);
      window.removeEventListener('themeRefresh', handleSettingsUpdate);
    };
  }, []);

  return settings;
}

// Helper function to get settings synchronously
export function getGlobalStoreSettings(): StoreSettings | null {
  if (typeof window !== 'undefined' && window.__STORE_SETTINGS__) {
    return window.__STORE_SETTINGS__;
  }
  return null;
}

// Function to update global settings
export function updateGlobalStoreSettings(newSettings: StoreSettings) {
  if (typeof window !== 'undefined') {
    window.__STORE_SETTINGS__ = { ...window.__STORE_SETTINGS__, ...newSettings };
    window.dispatchEvent(new CustomEvent('storeSettingsLoaded', { detail: window.__STORE_SETTINGS__ }));
  }
}
