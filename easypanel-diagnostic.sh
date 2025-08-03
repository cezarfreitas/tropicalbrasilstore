#!/bin/bash

# Script de Diagnóstico Automatizado EasyPanel
# Execute: chmod +x easypanel-diagnostic.sh && ./easypanel-diagnostic.sh

echo "🔍 === DIAGNÓSTICO EASYPANEL CHINELOS STORE ==="
echo "Timestamp: $(date)"
echo ""

# 1. Verificar containers
echo "📦 1. STATUS DOS CONTAINERS:"
echo "----------------------------------------"
docker ps -a | head -1
docker ps -a | grep -E "(chinelos|app)" || echo "❌ Nenhum container encontrado com 'chinelos' ou 'app'"
echo ""

# 2. Verificar se há algo rodando na porta 80
echo "🌐 2. VERIFICAÇÃO DA PORTA 80:"
echo "----------------------------------------"
PORT_80=$(lsof -i :80 2>/dev/null)
if [ -n "$PORT_80" ]; then
    echo "✅ Porta 80 em uso:"
    echo "$PORT_80"
else
    echo "❌ Porta 80 livre (pode ser o problema!)"
fi
echo ""

# 3. Verificar containers rodando
echo "🏃 3. CONTAINERS ATIVOS:"
echo "----------------------------------------"
CONTAINER_ID=$(docker ps --format "{{.ID}}" | head -1)
if [ -n "$CONTAINER_ID" ]; then
    echo "✅ Container ativo encontrado: $CONTAINER_ID"
    CONTAINER_NAME=$(docker ps --format "{{.Names}}" | head -1)
    echo "📝 Nome: $CONTAINER_NAME"
else
    echo "❌ Nenhum container ativo"
    echo ""
    echo "🔄 Tentando iniciar containers parados..."
    docker start $(docker ps -a -q) 2>/dev/null
fi
echo ""

# 4. Logs recentes do container
echo "📋 4. LOGS RECENTES (últimas 10 linhas):"
echo "----------------------------------------"
if [ -n "$CONTAINER_ID" ]; then
    docker logs "$CONTAINER_ID" --tail=10 2>/dev/null || echo "❌ Erro ao acessar logs"
else
    echo "❌ Nenhum container para verificar logs"
fi
echo ""

# 5. Teste de conectividade interna
echo "🔗 5. TESTE DE CONECTIVIDADE INTERNA:"
echo "----------------------------------------"
if [ -n "$CONTAINER_ID" ]; then
    echo "Testando curl interno no container..."
    INTERNAL_TEST=$(docker exec "$CONTAINER_ID" curl -s -I http://localhost:80 2>/dev/null)
    if [ -n "$INTERNAL_TEST" ]; then
        echo "✅ Servidor responde internamente:"
        echo "$INTERNAL_TEST" | head -3
    else
        echo "❌ Servidor não responde internamente"
        echo "Tentando com 127.0.0.1..."
        docker exec "$CONTAINER_ID" curl -s -I http://127.0.0.1:80 2>/dev/null || echo "❌ Também não responde em 127.0.0.1:80"
    fi
else
    echo "❌ Nenhum container para testar"
fi
echo ""

# 6. Teste de conectividade externa
echo "🌍 6. TESTE DE CONECTIVIDADE EXTERNA:"
echo "----------------------------------------"
EXTERNAL_TEST=$(curl -s -I http://localhost:80 2>/dev/null)
if [ -n "$EXTERNAL_TEST" ]; then
    echo "✅ Servidor acessível externamente:"
    echo "$EXTERNAL_TEST" | head -3
else
    echo "❌ Servidor NÃO acessível externamente (PROBLEMA PRINCIPAL!)"
fi
echo ""

# 7. Verificar health endpoint
echo "🏥 7. TESTE DE HEALTH ENDPOINT:"
echo "----------------------------------------"
HEALTH_TEST=$(curl -s http://localhost:80/health 2>/dev/null)
if [ -n "$HEALTH_TEST" ]; then
    echo "✅ Health endpoint responde:"
    echo "$HEALTH_TEST"
else
    echo "❌ Health endpoint não responde"
fi
echo ""

# 8. Verificar processos Node
echo "🟢 8. PROCESSOS NODE NO CONTAINER:"
echo "----------------------------------------"
if [ -n "$CONTAINER_ID" ]; then
    NODE_PROCESSES=$(docker exec "$CONTAINER_ID" ps aux 2>/dev/null | grep node)
    if [ -n "$NODE_PROCESSES" ]; then
        echo "✅ Processos Node encontrados:"
        echo "$NODE_PROCESSES"
    else
        echo "❌ Nenhum processo Node rodando no container"
    fi
else
    echo "❌ Nenhum container para verificar"
fi
echo ""

# 9. Verificar network do container
echo "🔌 9. CONFIGURAÇÃO DE REDE:"
echo "----------------------------------------"
if [ -n "$CONTAINER_ID" ]; then
    echo "Port mappings:"
    docker port "$CONTAINER_ID" 2>/dev/null || echo "❌ Erro ao verificar port mappings"
    echo ""
    echo "Network settings:"
    docker inspect "$CONTAINER_ID" --format='{{.NetworkSettings.Ports}}' 2>/dev/null || echo "❌ Erro ao verificar network"
else
    echo "❌ Nenhum container para verificar"
fi
echo ""

# 10. Resumo e recomendações
echo "📊 === RESUMO DO DIAGNÓSTICO ==="
echo ""

if [ -z "$CONTAINER_ID" ]; then
    echo "🚨 PROBLEMA CRÍTICO: Nenhum container rodando"
    echo "💡 SOLUÇÃO: Verificar configuração do EasyPanel e tentar deploy novamente"
elif [ -z "$EXTERNAL_TEST" ]; then
    echo "🚨 PROBLEMA PRINCIPAL: Container roda mas não é acessível externamente"
    echo "💡 POSSÍVEIS SOLUÇÕES:"
    echo "   1. Verificar port mapping no EasyPanel (deve ser 80:80)"
    echo "   2. Verificar configuração de proxy reverso"
    echo "   3. Verificar firewall/iptables"
    echo "   4. Verificar se domain/subdomain está configurado corretamente"
elif [ -n "$EXTERNAL_TEST" ]; then
    echo "✅ SISTEMA FUNCIONANDO: Tudo parece estar OK!"
    echo "💡 Se ainda não consegue acessar, verifique:"
    echo "   1. URL/domain configurado no EasyPanel"
    echo "   2. SSL/certificado"
    echo "   3. DNS"
fi

echo ""
echo "🔧 Para mais detalhes, consulte: EASYPANEL-DEBUG-COMPLETO.md"
echo "⏰ Diagnóstico concluído em: $(date)"
