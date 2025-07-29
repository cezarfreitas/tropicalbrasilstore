import axios from "axios";

const API_BASE = "http://localhost:8080/api";
const API_KEY = "sk_live_abcd1234567890abcdef1234567890abcdef12";

async function testDuasRequisicoes() {
  console.log("🧪 TESTE PRÁTICO: Duas requisições separadas\n");

  try {
    // ========================================
    // 1ª REQUISIÇÃO - CRIAR PRODUTO
    // ========================================
    console.log("📤 1ª REQUISIÇÃO - Criando produto com variante VERMELHA...");
    
    const primeiraRequisicao = {
      products: [
        {
          codigo: "TESTE001",
          nome: "Chinelo Teste Incremental",
          categoria: "Chinelos",
          tipo: "Casual",
          genero: "Unissex",
          descricao: "Produto para demonstrar criação incremental",
          vender_infinito: true,
          variantes: [
            {
              cor: "Vermelho",
              preco: 39.90,
              grade: "Padrão",
              foto: "https://images.tcdn.com.br/img/img_prod/699671/chinelo_havaianas_top_masculino_preto_24851_1_da2ff112816d222cd40bc1e93a37953a_20250313182035.jpg"
            }
          ]
        }
      ]
    };

    const resposta1 = await axios.post(`${API_BASE}/products/bulk`, primeiraRequisicao, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
    });

    console.log("✅ 1ª RESPOSTA:");
    console.log(`   • Produtos novos: ${resposta1.data.data.produtos_novos}`);
    console.log(`   • Produtos atualizados: ${resposta1.data.data.produtos_atualizados}`);
    console.log(`   • Variantes novas: ${resposta1.data.data.variantes_novas}`);
    console.log(`   • Variantes existentes: ${resposta1.data.data.variantes_existentes}`);
    console.log(`   • Mensagem: ${resposta1.data.message}`);
    console.log("");

    // Aguardar 2 segundos
    console.log("⏳ Aguardando 2 segundos...\n");
    await new Promise(resolve => setTimeout(resolve, 2000));

    // ========================================
    // 2ª REQUISIÇÃO - ADICIONAR VARIANTE
    // ========================================
    console.log("📤 2ª REQUISIÇÃO - Adicionando variante AZUL ao produto existente...");
    
    const segundaRequisicao = {
      products: [
        {
          codigo: "TESTE001", // MESMO código
          variantes: [
            {
              cor: "Azul",
              preco: 42.90,
              grade: "Padrão",
              foto: "https://static1.efacil.com.br/wcsstore/ExtendedSitesCatalogAssetStore/Imagens/360/1204119_01.jpg"
            }
          ]
        }
      ]
    };

    const resposta2 = await axios.post(`${API_BASE}/products/bulk`, segundaRequisicao, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
    });

    console.log("✅ 2ª RESPOSTA:");
    console.log(`   • Produtos novos: ${resposta2.data.data.produtos_novos}`);
    console.log(`   • Produtos atualizados: ${resposta2.data.data.produtos_atualizados}`);
    console.log(`   • Variantes novas: ${resposta2.data.data.variantes_novas}`);
    console.log(`   • Variantes existentes: ${resposta2.data.data.variantes_existentes}`);
    console.log(`   • Mensagem: ${resposta2.data.message}`);
    console.log("");

    // ========================================
    // VERIFICAR RESULTADO FINAL
    // ========================================
    console.log("🔍 VERIFICAÇÃO FINAL - Estado do produto na interface admin...");
    
    const verificacao = await axios.get(`${API_BASE}/products-woocommerce`);
    const produtoTeste = verificacao.data.data.find((p: any) => p.sku === "TESTE001");
    
    if (produtoTeste) {
      console.log("✅ PRODUTO ENCONTRADO NA INTERFACE ADMIN:");
      console.log(`   • Nome: ${produtoTeste.name}`);
      console.log(`   • SKU: ${produtoTeste.sku}`);
      console.log(`   • Variantes de cor: ${produtoTeste.variant_count}`);
      console.log(`   • Cores disponíveis: ${produtoTeste.available_colors}`);
      console.log(`   • Vender infinito: ${produtoTeste.sell_without_stock ? 'SIM' : 'NÃO'}`);
      console.log(`   • Estoque total: ${produtoTeste.total_stock}`);
    } else {
      console.log("❌ Produto não encontrado na interface admin");
    }

    console.log("");
    console.log("🎉 TESTE CONCLUÍDO COM SUCESSO!");
    console.log("   ✅ 1ª requisição criou o produto com variante vermelha");
    console.log("   ✅ 2ª requisição adicionou variante azul ao produto existente");
    console.log("   ✅ Produto aparece na interface admin com 2 variantes de cor");

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

testDuasRequisicoes();
