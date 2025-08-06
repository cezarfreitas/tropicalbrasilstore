import { Router } from 'express';
import db from '../lib/db';

const router = Router();

// GET /api/settings - Get store settings
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT * FROM store_settings ORDER BY id LIMIT 1
    `);
    
    let storeSettings = (rows as any[])[0];
    
    // If no settings exist, return defaults
    if (!storeSettings) {
      storeSettings = {
        store_name: 'Chinelos Store',
        primary_color: '#1d4ed8',
        secondary_color: '#64748b',
        accent_color: '#f59e0b',
        text_color: '#1f2937',
        background_color: '#ffffff',
        currency_symbol: 'R$',
        currency_position: 'before',
        decimal_places: 2,
        thousands_separator: '.',
        decimal_separator: ',',
        show_prices_to_guests: true,
        enable_customer_registration: true,
        enable_vendor_system: true,
        maintenance_mode: false,
      };
    }
    
    res.json({
      success: true,
      data: storeSettings
    });
    
  } catch (error) {
    console.error('Settings fetch error:', error);
    
    // Return default settings on error
    res.json({
      success: true,
      data: {
        store_name: 'Chinelos Store',
        primary_color: '#1d4ed8',
        secondary_color: '#64748b',
        accent_color: '#f59e0b',
        text_color: '#1f2937',
        background_color: '#ffffff',
        currency_symbol: 'R$',
        currency_position: 'before',
        decimal_places: 2,
        thousands_separator: '.',
        decimal_separator: ',',
        show_prices_to_guests: true,
        enable_customer_registration: true,
        enable_vendor_system: true,
        maintenance_mode: false,
      }
    });
  }
});

export { router as settingsRouter };
