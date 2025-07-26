// Script para testar o sistema de importação
const https = require('https');
const http = require('http');

async function testImportSystem() {
  console.log('🧪 Testando sistema de importação...');
  
  // Teste 1: Verificar se o endpoint de progresso responde
  try {
    console.log('📊 Testando endpoint de progresso...');
    const response = await fetch('http://localhost:3000/api/import/progress');
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Endpoint de progresso funcionando:', data);
    } else {
      console.log('❌ Endpoint de progresso falhou:', response.status);
    }
  } catch (error) {
    console.log('❌ Erro ao testar progresso:', error.message);
  }
  
  // Teste 2: Verificar se as categorias estão sendo carregadas
  try {
    console.log('📂 Testando endpoint de categorias...');
    const response = await fetch('http://localhost:3000/api/categories');
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Categorias carregadas:', data.length, 'categorias');
    } else {
      console.log('❌ Endpoint de categorias falhou:', response.status);
    }
  } catch (error) {
    console.log('❌ Erro ao testar categorias:', error.message);
  }
  
  // Teste 3: Verificar se size groups estão funcionando
  try {
    console.log('📏 Testando endpoint de size groups...');
    const response = await fetch('http://localhost:3000/api/size-groups');
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Size groups carregados:', data.length, 'grupos');
    } else {
      console.log('❌ Endpoint de size groups falhou:', response.status);
    }
  } catch (error) {
    console.log('❌ Erro ao testar size groups:', error.message);
  }
  
  // Teste 4: Verificar estatísticas de exportação
  try {
    console.log('📈 Testando endpoint de export stats...');
    const response = await fetch('http://localhost:3000/api/import/export-stats');
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Export stats funcionando:', data);
    } else {
      console.log('❌ Endpoint de export stats falhou:', response.status);
    }
  } catch (error) {
    console.log('❌ Erro ao testar export stats:', error.message);
  }
}

// Verificar se fetch está disponível
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

testImportSystem().then(() => {
  console.log('🏁 Teste do sistema de importação concluído!');
}).catch(error => {
  console.error('💥 Erro durante o teste:', error);
});
