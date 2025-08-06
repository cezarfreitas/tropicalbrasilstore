import { Router } from 'express';
import mysql from 'mysql2/promise';

const router = Router();

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'chinelos_store',
  port: Number(process.env.DB_PORT) || 3306,
};

// Helper function to get database connection
async function getDbConnection() {
  try {
    return await mysql.createConnection(dbConfig);
  } catch (error) {
    console.error('Database connection error:', error);
    throw new Error('Failed to connect to database');
  }
}

// GET /api/settings - Get store settings
router.get('/', async (req, res) => {
  let connection;
  
  try {
    connection = await getDbConnection();
    
    const [rows] = await connection.execute(`
      SELECT 
        setting_key,
        setting_value,
        setting_type
      FROM store_settings 
      WHERE is_active = 1
    `);
    
    // Convert array of settings to object
    const settings: Record<string, any> = {};
    
    (rows as any[]).forEach((row) => {
      const { setting_key, setting_value, setting_type } = row;
      
      let value = setting_value;
      
      // Convert based on type
      if (setting_type === 'boolean') {
        value = setting_value === '1' || setting_value === 'true' || setting_value === true;
      } else if (setting_type === 'number') {
        value = parseFloat(setting_value) || 0;
      } else if (setting_type === 'json') {
        try {
          value = JSON.parse(setting_value);
        } catch {
          value = setting_value;
        }
      }
      
      settings[setting_key] = value;
    });
    
    // Apply default values if not set
    const defaultSettings = {
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
    
    const finalSettings = { ...defaultSettings, ...settings };
    
    res.json({
      success: true,
      data: finalSettings
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
