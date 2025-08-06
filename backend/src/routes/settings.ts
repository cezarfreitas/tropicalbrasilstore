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
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// POST/PUT /api/settings - Update store settings
router.post('/', async (req, res) => {
  let connection;
  
  try {
    connection = await getDbConnection();
    const settings = req.body;
    
    // Begin transaction
    await connection.beginTransaction();
    
    for (const [key, value] of Object.entries(settings)) {
      const setting_type = typeof value === 'boolean' ? 'boolean' :
                          typeof value === 'number' ? 'number' :
                          typeof value === 'object' ? 'json' : 'string';
      
      const setting_value = typeof value === 'object' ? JSON.stringify(value) : String(value);
      
      await connection.execute(`
        INSERT INTO store_settings (setting_key, setting_value, setting_type, is_active, updated_at)
        VALUES (?, ?, ?, 1, NOW())
        ON DUPLICATE KEY UPDATE
        setting_value = VALUES(setting_value),
        setting_type = VALUES(setting_type),
        updated_at = NOW()
      `, [key, setting_value, setting_type]);
    }
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Settings updated successfully'
    });
    
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Settings update error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to update settings'
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// PUT /api/settings/:key - Update single setting
router.put('/:key', async (req, res) => {
  let connection;
  
  try {
    connection = await getDbConnection();
    const { key } = req.params;
    const { value } = req.body;
    
    const setting_type = typeof value === 'boolean' ? 'boolean' :
                        typeof value === 'number' ? 'number' :
                        typeof value === 'object' ? 'json' : 'string';
    
    const setting_value = typeof value === 'object' ? JSON.stringify(value) : String(value);
    
    await connection.execute(`
      INSERT INTO store_settings (setting_key, setting_value, setting_type, is_active, updated_at)
      VALUES (?, ?, ?, 1, NOW())
      ON DUPLICATE KEY UPDATE
      setting_value = VALUES(setting_value),
      setting_type = VALUES(setting_type),
      updated_at = NOW()
    `, [key, setting_value, setting_type]);
    
    res.json({
      success: true,
      message: `Setting '${key}' updated successfully`
    });
    
  } catch (error) {
    console.error('Setting update error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to update setting'
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

export { router as settingsRouter };
