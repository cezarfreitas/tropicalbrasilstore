import db from "./db";

export async function createNotificationSettings() {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    // Check if notification_settings table exists
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'notification_settings'"
    );

    if ((tables as any[]).length === 0) {
      // Create notification_settings table
      await connection.execute(`
        CREATE TABLE notification_settings (
          id INT PRIMARY KEY AUTO_INCREMENT,
          setting_key VARCHAR(100) UNIQUE NOT NULL,
          setting_value TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      console.log("✅ Created notification_settings table");

      // Insert default email settings
      const defaultSettings = [
        // Email SMTP Settings
        {
          key: 'smtp_host',
          value: ''
        },
        {
          key: 'smtp_port',
          value: '587'
        },
        {
          key: 'smtp_user',
          value: ''
        },
        {
          key: 'smtp_password',
          value: ''
        },
        {
          key: 'smtp_from_email',
          value: ''
        },
        {
          key: 'smtp_from_name',
          value: 'Chinelos Store'
        },
        {
          key: 'email_enabled',
          value: 'false'
        },
        
        // Email Template
        {
          key: 'email_subject',
          value: '🎉 Novo Pedido Recebido - Chinelos Store'
        },
        {
          key: 'email_template',
          value: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Novo Pedido</title>
    <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 2px solid #ff6b35; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { color: #ff6b35; font-size: 28px; font-weight: bold; }
        .order-info { background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .customer-info { background-color: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .item { border-bottom: 1px solid #eee; padding: 10px 0; }
        .item:last-child { border-bottom: none; }
        .total { font-size: 20px; font-weight: bold; color: #ff6b35; text-align: right; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🩴 Chinelos Store</div>
            <h2>Novo Pedido Recebido!</h2>
        </div>
        
        <div class="order-info">
            <h3>📦 Informações do Pedido</h3>
            <p><strong>Número:</strong> {{ORDER_ID}}</p>
            <p><strong>Data:</strong> {{ORDER_DATE}}</p>
            <p><strong>Status:</strong> {{ORDER_STATUS}}</p>
        </div>

        <div class="customer-info">
            <h3>👤 Dados do Cliente</h3>
            <p><strong>Nome:</strong> {{CUSTOMER_NAME}}</p>
            <p><strong>Email:</strong> {{CUSTOMER_EMAIL}}</p>
            <p><strong>WhatsApp:</strong> {{CUSTOMER_WHATSAPP}}</p>
        </div>

        <div class="order-info">
            <h3>🛍️ Itens do Pedido</h3>
            {{ORDER_ITEMS}}
        </div>

        <div class="total">
            💰 Total: R$ {{TOTAL_PRICE}}
        </div>

        <div class="footer">
            <p>Este email foi gerado automaticamente pelo sistema Chinelos Store</p>
            <p>Data de envio: {{EMAIL_DATE}}</p>
        </div>
    </div>
</body>
</html>`
        },
        
        // Webhook Settings
        {
          key: 'webhook_enabled',
          value: 'false'
        },
        {
          key: 'webhook_url',
          value: ''
        },
        {
          key: 'webhook_method',
          value: 'POST'
        },
        {
          key: 'webhook_headers',
          value: '{"Content-Type": "application/json"}'
        },
        {
          key: 'webhook_template',
          value: `{
  "type": "new_order",
  "timestamp": "{{TIMESTAMP}}",
  "order": {
    "id": "{{ORDER_ID}}",
    "status": "{{ORDER_STATUS}}",
    "total": "{{TOTAL_PRICE}}",
    "date": "{{ORDER_DATE}}"
  },
  "customer": {
    "name": "{{CUSTOMER_NAME}}",
    "email": "{{CUSTOMER_EMAIL}}",
    "whatsapp": "{{CUSTOMER_WHATSAPP}}"
  },
  "items": {{ORDER_ITEMS_JSON}},
  "store": {
    "name": "Chinelos Store",
    "message": "🎉 Novo pedido recebido! Total: R$ {{TOTAL_PRICE}}"
  }
}`
        }
      ];

      // Insert all default settings
      for (const setting of defaultSettings) {
        await connection.execute(
          "INSERT INTO notification_settings (setting_key, setting_value) VALUES (?, ?)",
          [setting.key, setting.value]
        );
      }

      console.log("✅ Inserted default notification settings");
    } else {
      console.log("ℹ️ notification_settings table already exists");
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    console.error("❌ Error creating notification settings:", error);
    throw error;
  } finally {
    connection.release();
  }
}

// Helper function to get a setting value
export async function getNotificationSetting(key: string): Promise<string | null> {
  try {
    const [rows] = await db.execute(
      "SELECT setting_value FROM notification_settings WHERE setting_key = ?",
      [key]
    );

    const result = rows as any[];
    return result.length > 0 ? result[0].setting_value : null;
  } catch (error) {
    console.error(`Error getting setting ${key}:`, error);
    return null;
  }
}

// Helper function to update a setting value
export async function updateNotificationSetting(key: string, value: string): Promise<void> {
  try {
    await db.execute(
      "INSERT INTO notification_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?",
      [key, value, value]
    );
  } catch (error) {
    console.error(`Error updating setting ${key}:`, error);
    throw error;
  }
}

// Get all notification settings
export async function getAllNotificationSettings(): Promise<Record<string, string>> {
  try {
    const [rows] = await db.execute(
      "SELECT setting_key, setting_value FROM notification_settings"
    );

    const settings: Record<string, string> = {};
    (rows as any[]).forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });

    return settings;
  } catch (error) {
    console.error("Error getting all settings:", error);
    return {};
  }
}
