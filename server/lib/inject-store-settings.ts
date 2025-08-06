import { Request, Response, NextFunction } from 'express';
import db from './db';

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

let cachedSettings: StoreSettings | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 60 * 1000; // 1 minute cache

async function getStoreSettings(): Promise<StoreSettings> {
  const now = Date.now();
  
  // Return cached settings if still valid
  if (cachedSettings && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedSettings;
  }

  try {
    const [settings] = await db.execute(`
      SELECT store_name, logo_url, primary_color, secondary_color,
             accent_color, background_color, text_color, minimum_order_value
      FROM store_settings ORDER BY id LIMIT 1
    `);

    const settingsData = (settings as any[])[0];
    
    if (settingsData) {
      cachedSettings = {
        store_name: settingsData.store_name || 'Chinelos Store',
        logo_url: settingsData.logo_url,
        primary_color: settingsData.primary_color || '#f97316',
        secondary_color: settingsData.secondary_color || '#ea580c',
        accent_color: settingsData.accent_color || '#fed7aa',
        background_color: settingsData.background_color || '#ffffff',
        text_color: settingsData.text_color || '#1f2937',
        minimum_order_value: settingsData.minimum_order_value || 0,
      };
    } else {
      // Default settings if none exist
      cachedSettings = {
        store_name: 'Chinelos Store',
        logo_url: null,
        primary_color: '#f97316',
        secondary_color: '#ea580c',
        accent_color: '#fed7aa',
        background_color: '#ffffff',
        text_color: '#1f2937',
        minimum_order_value: 50,
      };
    }
    
    lastFetchTime = now;
    return cachedSettings;
    
  } catch (error) {
    console.error('Error fetching store settings for injection:', error);
    
    // Return default settings on error
    return {
      store_name: 'Chinelos Store',
      logo_url: null,
      primary_color: '#f97316',
      secondary_color: '#ea580c',
      accent_color: '#fed7aa',
      background_color: '#ffffff',
      text_color: '#1f2937',
      minimum_order_value: 50,
    };
  }
}

export async function injectStoreSettings(req: Request, res: Response, next: NextFunction) {
  // Only inject for HTML requests
  if (req.path === '/' || req.path.endsWith('.html')) {
    try {
      const settings = await getStoreSettings();
      
      // Store settings in res.locals so they can be used in HTML template
      res.locals.storeSettings = settings;
      
      // Also set as a header for debugging
      res.set('X-Store-Settings-Injected', 'true');
      
    } catch (error) {
      console.error('Error in inject store settings middleware:', error);
    }
  }
  
  next();
}

// Function to clear cache when settings are updated
export function clearSettingsCache() {
  cachedSettings = null;
  lastFetchTime = 0;
  console.log('🗑️ Store settings cache cleared');
}
