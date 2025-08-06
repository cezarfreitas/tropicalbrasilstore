// Script temporário para verificar pedido mínimo do cliente
const db = require('./server/lib/db.ts');

async function checkCustomer() {
  try {
    // Verificar se o cliente existe na tabela customers
    const [customerRows] = await db.execute(`
      SELECT 
        email, 
        name, 
        minimum_order,
        created_at,
        vendor_id
      FROM customers 
      WHERE email = ?
    `, ['cezarfreitas2011@gmail.com']);

    console.log('=== RESULTADO DA CONSULTA ===');
    if (customerRows.length > 0) {
      const customer = customerRows[0];
      console.log('✅ Cliente encontrado:');
      console.log(`📧 Email: ${customer.email}`);
      console.log(`👤 Nome: ${customer.name}`);
      console.log(`💰 Pedido Mínimo: R$ ${customer.minimum_order || '0,00'}`);
      console.log(`📅 Criado em: ${customer.created_at}`);
      console.log(`🏪 Vendedor ID: ${customer.vendor_id || 'Nenhum'}`);
    } else {
      console.log('❌ Cliente não encontrado na tabela customers');
      
      // Verificar se existe na tabela customer_auth
      const [authRows] = await db.execute(`
        SELECT 
          email, 
          name, 
          status,
          created_at
        FROM customer_auth 
        WHERE email = ?
      `, ['cezarfreitas2011@gmail.com']);
      
      if (authRows.length > 0) {
        const authCustomer = authRows[0];
        console.log('⚠️  Cliente encontrado apenas na tabela customer_auth:');
        console.log(`📧 Email: ${authCustomer.email}`);
        console.log(`👤 Nome: ${authCustomer.name}`);
        console.log(`📊 Status: ${authCustomer.status}`);
        console.log(`📅 Criado em: ${authCustomer.created_at}`);
        console.log('💡 Pedido mínimo não configurado (cliente não migrado para tabela customers)');
      } else {
        console.log('❌ Cliente não encontrado em nenhuma tabela');
      }
    }

    // Verificar configuração global
    const [globalSettings] = await db.execute(`
      SELECT minimum_order_value FROM store_settings ORDER BY id LIMIT 1
    `);
    
    console.log('\n=== CONFIGURAÇÃO GLOBAL ===');
    if (globalSettings.length > 0) {
      console.log(`🌐 Pedido mínimo global: R$ ${globalSettings[0].minimum_order_value || '0,00'}`);
    } else {
      console.log('❌ Configuração global não encontrada');
    }

  } catch (error) {
    console.error('❌ Erro ao consultar:', error.message);
  } finally {
    await db.end();
  }
}

checkCustomer();
