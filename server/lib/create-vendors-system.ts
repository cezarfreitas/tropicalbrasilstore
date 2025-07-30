import db from "./db";

export async function createVendorsSystem() {
  try {
    console.log("🔧 Criando sistema de vendedores...");

    // Criar tabela de vendedores
    await db.execute(`
      CREATE TABLE IF NOT EXISTS vendors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20),
        commission_percentage DECIMAL(5,2) DEFAULT 5.00 COMMENT 'Percentual de comissão do vendedor',
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        -- Dados de acesso
        password_hash VARCHAR(255),
        last_login TIMESTAMP NULL,
        
        -- Informações de perfil
        avatar_url VARCHAR(500),
        bio TEXT,
        
        -- Configurações
        notification_email BOOLEAN DEFAULT true,
        notification_whatsapp BOOLEAN DEFAULT true,
        
        INDEX idx_email (email),
        INDEX idx_active (active)
      ) ENGINE=InnoDB CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✅ Tabela vendors criada");

    // Verificar se a coluna vendor_id já existe na tabela orders
    const [ordersColumns] = await db.execute(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'orders'
        AND COLUMN_NAME = 'vendor_id'
    `);

    if ((ordersColumns as any[]).length === 0) {
      // Adicionar coluna vendor_id à tabela orders
      await db.execute(`
        ALTER TABLE orders
        ADD COLUMN vendor_id INT NULL,
        ADD COLUMN assigned_at TIMESTAMP NULL,
        ADD COLUMN assigned_by VARCHAR(255) NULL COMMENT 'Quem atribuiu o pedido ao vendedor',
        ADD INDEX idx_vendor_id (vendor_id),
        ADD FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL
      `);
      console.log("✅ Coluna vendor_id adicionada à tabela orders");
    } else {
      console.log("ℹ️ Coluna vendor_id já existe na tabela orders");
    }

    // Verificar se a coluna vendor_id já existe na tabela customers (para vendedor padrão)
    const [customersColumns] = await db.execute(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'customers'
        AND COLUMN_NAME = 'vendor_id'
    `);

    if ((customersColumns as any[]).length === 0) {
      // Adicionar coluna vendor_id à tabela customers
      await db.execute(`
        ALTER TABLE customers
        ADD COLUMN vendor_id INT NULL COMMENT 'Vendedor padrão do cliente',
        ADD COLUMN vendor_assigned_at TIMESTAMP NULL,
        ADD COLUMN vendor_assigned_by VARCHAR(255) NULL COMMENT 'Quem atribuiu o vendedor ao cliente',
        ADD INDEX idx_customer_vendor_id (vendor_id),
        ADD FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL
      `);
      console.log("✅ Coluna vendor_id adicionada à tabela customers");
    } else {
      console.log("ℹ️ Coluna vendor_id já existe na tabela customers");
    }

    // Criar tabela de comissões
    await db.execute(`
      CREATE TABLE IF NOT EXISTS vendor_commissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        vendor_id INT NOT NULL,
        order_id INT NOT NULL,
        order_total DECIMAL(10,2) NOT NULL,
        commission_percentage DECIMAL(5,2) NOT NULL,
        commission_amount DECIMAL(10,2) NOT NULL,
        status ENUM('pending', 'paid', 'cancelled') DEFAULT 'pending',
        paid_at TIMESTAMP NULL,
        paid_by VARCHAR(255) NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        UNIQUE KEY unique_order_vendor (order_id, vendor_id),
        INDEX idx_vendor_status (vendor_id, status),
        INDEX idx_status (status)
      ) ENGINE=InnoDB CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✅ Tabela vendor_commissions criada");

    // Criar tabela de sessões de vendedores
    await db.execute(`
      CREATE TABLE IF NOT EXISTS vendor_sessions (
        id VARCHAR(255) PRIMARY KEY,
        vendor_id INT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
        INDEX idx_vendor_id (vendor_id),
        INDEX idx_expires_at (expires_at)
      ) ENGINE=InnoDB CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✅ Tabela vendor_sessions criada");

    // Inserir vendedores de exemplo
    const [existingVendors] = await db.execute(
      "SELECT COUNT(*) as count FROM vendors"
    );

    if ((existingVendors as any[])[0].count === 0) {
      await db.execute(`
        INSERT INTO vendors (name, email, phone, commission_percentage, active) VALUES
        ('João Silva', 'joao.silva@empresa.com', '(11) 99999-1234', 7.50, true),
        ('Maria Santos', 'maria.santos@empresa.com', '(11) 99999-5678', 6.00, true),
        ('Pedro Costa', 'pedro.costa@empresa.com', '(11) 99999-9876', 5.50, true)
      `);
      console.log("✅ Vendedores de exemplo inseridos");
    }

    // Verificar estrutura criada
    const [vendorCount] = await db.execute(
      "SELECT COUNT(*) as count FROM vendors WHERE active = true"
    );

    console.log(`📊 Sistema de vendedores criado com sucesso!`);
    console.log(`📈 Vendedores ativos: ${(vendorCount as any[])[0].count}`);

  } catch (error) {
    console.error("❌ Erro ao criar sistema de vendedores:", error);
    throw error;
  }
}
