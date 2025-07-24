import { useState, useEffect } from 'react';

interface StoreSettings {
  store_name?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  background_color?: string;
  text_color?: string;
  [key: string]: any;
}

const STORAGE_KEY = 'store-settings';

export function useStoreSettings() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Load stored settings immediately
  useEffect(() => {
    const loadStoredSettings = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsedSettings = JSON.parse(stored);
          setSettings(parsedSettings);
          setLoading(false);
          return parsedSettings;
        }
      } catch (error) {
        console.error('Error loading stored settings:', error);
      }
      return null;
    };

    // Load immediately from cache
    const cachedSettings = loadStoredSettings();
    
    // Fetch fresh settings from server
    fetchSettings(cachedSettings);

    // Listen for settings refresh events
    const handleSettingsRefresh = () => {
      fetchSettings();
    };

    window.addEventListener('settingsRefresh', handleSettingsRefresh);
    window.addEventListener('themeRefresh', handleSettingsRefresh);

    return () => {
      window.removeEventListener('settingsRefresh', handleSettingsRefresh);
      window.removeEventListener('themeRefresh', handleSettingsRefresh);
    };
  }, []);

  const fetchSettings = async (currentSettings?: StoreSettings | null) => {
    try {
      console.log('🏪 Fetching store settings...');
      const response = await fetch('/api/settings');
      if (response.ok) {
        const freshSettings = await response.json();
        
        // Only update if settings actually changed
        if (JSON.stringify(freshSettings) !== JSON.stringify(currentSettings)) {
          setSettings(freshSettings);
          
          // Store in localStorage for immediate next load
          localStorage.setItem(STORAGE_KEY, JSON.stringify(freshSettings));
          console.log('🏪 Settings updated and cached');
        }
      } else {
        console.error('Failed to fetch settings, status:', response.status);
      }
    } catch (error) {
      console.error('Error fetching store settings:', error);
    } finally {
      setLoading(false);
    }
  };

  return { settings, loading, refetch: () => fetchSettings() };
}

// Helper function to get cached settings synchronously
export function getCachedStoreSettings(): StoreSettings | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error loading cached settings:', error);
    return null;
  }
}
