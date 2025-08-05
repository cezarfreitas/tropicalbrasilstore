#!/bin/bash

# Script de Health Check Profissional
# Verifica se a aplicação está funcionando corretamente

set -e

HOST=${1:-localhost}
PORT=${2:-80}
TIMEOUT=${3:-10}

echo "🔍 Verificando saúde da aplicação em ${HOST}:${PORT}..."

# Função para verificar endpoint
check_endpoint() {
    local endpoint=$1
    local expected_status=${2:-200}
    local description=$3
    
    echo "📡 Testando ${description}: ${endpoint}"
    
    status_code=$(curl -s -o /dev/null -w "%{http_code}" \
        --connect-timeout $TIMEOUT \
        --max-time $TIMEOUT \
        "http://${HOST}:${PORT}${endpoint}" || echo "000")
    
    if [ "$status_code" = "$expected_status" ]; then
        echo "✅ ${description}: OK (${status_code})"
        return 0
    else
        echo "❌ ${description}: FALHOU (${status_code})"
        return 1
    fi
}

# Função para verificar assets
check_assets() {
    echo "���� Verificando assets estáticos..."
    
    # Obter lista de assets do debug endpoint
    assets_response=$(curl -s --connect-timeout $TIMEOUT \
        "http://${HOST}:${PORT}/debug/status" 2>/dev/null || echo "{}")
    
    if echo "$assets_response" | grep -q "assetFiles"; then
        echo "✅ Debug endpoint acessível"
        
        # Extrair primeiro asset JS (se existir)
        js_asset=$(echo "$assets_response" | grep -o '"[^"]*\.js"' | head -1 | tr -d '"')
        
        if [ -n "$js_asset" ]; then
            check_endpoint "/assets/${js_asset}" 200 "Asset JS"
        else
            echo "⚠️  Nenhum asset JS encontrado"
        fi
    else
        echo "❌ Não foi possível verificar assets"
        return 1
    fi
}

# Array de testes
declare -A tests=(
    ["/health"]="Health Check"
    ["/api/ping"]="API Ping" 
    ["/debug/status"]="Debug Status"
    ["/"]="Homepage React"
)

echo "🚀 Iniciando verificações de saúde..."
echo "⏰ Timeout: ${TIMEOUT}s"
echo ""

# Contador de falhas
failures=0

# Executar testes principais
for endpoint in "${!tests[@]}"; do
    if ! check_endpoint "$endpoint" 200 "${tests[$endpoint]}"; then
        ((failures++))
    fi
done

# Verificar assets
if ! check_assets; then
    ((failures++))
fi

echo ""

# Relatório final
if [ $failures -eq 0 ]; then
    echo "🎉 Todos os testes passaram! Aplicação está saudável."
    exit 0
else
    echo "💥 $failures teste(s) falharam. Aplicação pode ter problemas."
    exit 1
fi
