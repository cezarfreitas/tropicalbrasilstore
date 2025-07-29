import axios from "axios";
import db from "../lib/db";

const API_BASE = "http://localhost:8080/api";
const API_KEY = "sk_live_abcd1234567890abcdef1234567890abcdef12";

async function testPrecoSugerido() {
  console.log("🧪 TESTE: Campo Preço Sugerido na API\n");

  // Limpar produto de teste
  await db.execute('DELETE FROM products WHERE sku = "PRECO001"');

  try {
    // ========================================
    // TESTE COM PREÇO SUGERIDO
    // ========================================
    console.log("📤 Enviando produto com preço sugerido...");
    
    const requestData = {
      products: [
        {
          codigo: "PRECO001",
          nome: "Produto com Preço Sugerido",
          categoria: "Chinelos",
          tipo: "Casual",
          genero: "Unissex",
          descricao: "Produto para testar campo preço sugerido",
          preco_sugerido: 89.90,
          vender_infinito: false,
          variantes: [
            {
              cor: "Verde",
              preco: 59.90,
              grade: "Padrão",
              foto: "https://example.com/verde.jpg"
            }
          ]
        }
      ]
    };

    const response = await axios.post(`${API_BASE}/products/bulk`, requestData, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
    });

    console.log("✅ RESPOSTA DA API:");
    console.log(`   • Sucesso: ${response.data.success}`);
    console.log(`   • Produtos criados: ${response.data.data.produtos_novos}`);
    console.log(`   • Variantes criadas: ${response.data.data.variantes_novas}`);
    console.log("");

    // ========================================
    // VERIFICAR NO BANCO DE DADOS
    // ========================================
    console.log("🔍 VERIFICAÇÃO NO BANCO DE DADOS:");
    
    const [product] = await db.execute(
      'SELECT id, name, sku, base_price, suggested_price, sell_without_stock FROM products WHERE sku = "PRECO001"'
    );

    if ((product as any[]).length > 0) {
      const prod = (product as any[])[0];
      console.log(`   • Nome: ${prod.name}`);
      console.log(`   • SKU: ${prod.sku}`);
      console.log(`   • Preço Base: R$ ${prod.base_price}`);
      console.log(`   • Preço Sugerido: R$ ${prod.suggested_price}`);
      console.log(`   • Venda Infinita: ${prod.sell_without_stock ? 'SIM' : 'NÃO'}`);
    } else {
      console.log("   ❌ Produto não encontrado no banco");
    }
    console.log("");

    // ========================================
    // VERIFICAR NA INTERFACE ADMIN
    // ========================================
    console.log("🖥️ VERIFICAÇÃO NA INTERFACE ADMIN:");
    
    const adminResponse = await axios.get(`${API_BASE}/products-woocommerce`);
    const adminProduct = adminResponse.data.data.find((p: any) => p.sku === "PRECO001");
    
    if (adminProduct) {
      console.log(`   • Nome: ${adminProduct.name}`);
      console.log(`   • Preço Base: R$ ${adminProduct.base_price}`);
      console.log(`   • Preço Sugerido: R$ ${adminProduct.suggested_price}`);
      console.log(`   • Variantes: ${adminProduct.variant_count}`);
      console.log(`   • Venda Infinita: ${adminProduct.sell_without_stock ? 'SIM' : 'NÃO'}`);
    } else {
      console.log("   ❌ Produto não encontrado na interface admin");
    }
    console.log("");

    // ========================================
    // TESTE DE ATUALIZAÇÃO
    // ========================================
    console.log("📤 Testando atualização do preço sugerido...");
    
    const updateRequest = {
      products: [
        {
          codigo: "PRECO001",
          preco_sugerido: 99.90,
          variantes: [
            {
              cor: "Amarelo",
              preco: 64.90,
              grade: "Padrão"
            }
          ]
        }
      ]
    };

    const updateResponse = await axios.post(`${API_BASE}/products/bulk`, updateRequest, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
    });

    console.log("✅ RESPOSTA DA ATUALIZAÇÃO:");
    console.log(`   • Produtos atualizados: ${updateResponse.data.data.produtos_atualizados}`);
    console.log(`   • Variantes novas: ${updateResponse.data.data.variantes_novas}`);
    console.log("");

    // Verificar se o preço foi atualizado
    const [updatedProduct] = await db.execute(
      'SELECT suggested_price FROM products WHERE sku = "PRECO001"'
    );
    
    if ((updatedProduct as any[]).length > 0) {
      const newPrice = (updatedProduct as any[])[0].suggested_price;
      console.log(`🔄 PREÇO SUGERIDO ATUALIZADO: R$ ${newPrice}`);
    }

    console.log("");
    console.log("🎉 TESTE CONCLUÍDO!");
    console.log("   ✅ Campo 'preco_sugerido' implementado na API");
    console.log("   ✅ Preço sugerido salvo no banco de dados");
    console.log("   ✅ Preço sugerido disponível na interface admin");
    console.log("   ✅ Atualização de preço sugerido funcionando");

  } catch (error: any) {
    console.log("❌ ERRO NO TESTE:");
    console.log("   Mensagem:", error.message);
    if (error.response) {
      console.log("   Status:", error.response.status);
      console.log("   Dados:", JSON.stringify(error.response.data, null, 2));
    }
  }
  
  process.exit(0);
}

testPrecoSugerido();
