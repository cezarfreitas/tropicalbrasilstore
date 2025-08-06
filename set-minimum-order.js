// Script para configurar pedido mínimo de teste
const mysql = require('mysql2/promise');

async function setMinimumOrder() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root', 
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'ecommerce'
  });

  try {
    // Primeiro verificar se o cliente existe na tabela customers
    const [existingCustomer] = await connection.execute(`
      SELECT email, minimum_order FROM customers WHERE email = ?
    `, ['cezarfreitas2011@gmail.com']);

    if (existingCustomer.length > 0) {
      // Cliente já existe, apenas atualizar o minimum_order
      await connection.execute(`
        UPDATE customers SET minimum_order = ? WHERE email = ?
      `, [100.00, 'cezarfreitas2011@gmail.com']);
      
      console.log('✅ Pedido mínimo atualizado para R$ 100,00');
    } else {
      // Cliente não existe na tabela customers, vamos criar com dados básicos
      // Primeiro buscar dados do customer_auth
      const [authData] = await connection.execute(`
        SELECT name, email, whatsapp FROM customer_auth WHERE email = ?
      `, ['cezarfreitas2011@gmail.com']);
      
      if (authData.length > 0) {
        const customer = authData[0];
        await connection.execute(`
          INSERT INTO customers (name, email, whatsapp, minimum_order) 
          VALUES (?, ?, ?, ?)
        `, [customer.name, customer.email, customer.whatsapp, 100.00]);
        
        console.log('✅ Cliente criado na tabela customers com pedido mínimo de R$ 100,00');
      } else {
        console.log('❌ Cliente não encontrado em customer_auth');
      }
    }

    // Verificar se foi configurado corretamente
    const [result] = await connection.execute(`
      SELECT email, name, minimum_order FROM customers WHERE email = ?
    `, ['cezarfreitas2011@gmail.com']);
    
    if (result.length > 0) {
      const customer = result[0];
      console.log('\n=== CONFIGURAÇÃO ATUAL ===');
      console.log(`📧 Email: ${customer.email}`);
      console.log(`👤 Nome: ${customer.name}`);
      console.log(`💰 Pedido Mínimo: R$ ${customer.minimum_order}`);
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await connection.end();
  }
}

setMinimumOrder();
