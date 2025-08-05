#!/bin/bash

echo "🔍 DIAGNÓSTICO COMPLETO - Chinelos Store"
echo "========================================"

echo ""
echo "📁 1. VERIFICANDO ESTRUTURA DE ARQUIVOS:"
echo "----------------------------------------"

# Arquivos principais
echo "📋 Arquivos de configuração:"
[ -f package.json ] && echo "✅ package.json" || echo "❌ package.json FALTANDO"
[ -f tsconfig.json ] && echo "✅ tsconfig.json" || echo "❌ tsconfig.json FALTANDO" 
[ -f index.html ] && echo "✅ index.html" || echo "❌ index.html FALTANDO"

echo ""
echo "🏗️ Arquivos de build:"
[ -f build.js ] && echo "✅ build.js" || echo "❌ build.js FALTANDO"
[ -f vite.config.ts ] && echo "✅ vite.config.ts" || echo "❌ vite.config.ts FALTANDO"
[ -f vite.config.server.ts ] && echo "✅ vite.config.server.ts" || echo "❌ vite.config.server.ts FALTANDO"

echo ""
echo "🚀 Arquivos de servidor:"
[ -f server/index.ts ] && echo "✅ server/index.ts" || echo "❌ server/index.ts FALTANDO"
[ -f server/production.ts ] && echo "✅ server/production.ts" || echo "❌ server/production.ts FALTANDO"

echo ""
echo "📦 2. VERIFICANDO BUILDS:"
echo "-------------------------"
[ -f dist/server/production.js ] && echo "✅ dist/server/production.js" || echo "❌ dist/server/production.js FALTANDO"
[ -f dist/spa/index.html ] && echo "✅ dist/spa/index.html" || echo "❌ dist/spa/index.html FALTANDO"
[ -d dist/spa/assets ] && echo "✅ dist/spa/assets/" || echo "❌ dist/spa/assets/ FALTANDO"

echo ""
echo "🔧 3. VERIFICANDO DEPENDÊNCIAS:"
echo "--------------------------------"
[ -d node_modules ] && echo "✅ node_modules/" || echo "❌ node_modules/ FALTANDO - Execute: npm install"

echo ""
echo "📂 4. VERIFICANDO ESTRUTURA CLIENT:"
echo "-----------------------------------"
[ -d client ] && echo "✅ client/" || echo "❌ client/ FALTANDO"
[ -f client/App.tsx ] && echo "✅ client/App.tsx" || echo "❌ client/App.tsx FALTANDO"
[ -d client/components ] && echo "✅ client/components/" || echo "❌ client/components/ FALTANDO"
[ -d client/pages ] && echo "✅ client/pages/" || echo "❌ client/pages/ FALTANDO"

echo ""
echo "🗃️ 5. VERIFICANDO ESTRUTURA SERVER:"
echo "-----------------------------------"
[ -d server/routes ] && echo "✅ server/routes/" || echo "❌ server/routes/ FALTANDO"
[ -d server/lib ] && echo "✅ server/lib/" || echo "❌ server/lib/ FALTANDO"
[ -f server/lib/db.ts ] && echo "✅ server/lib/db.ts" || echo "❌ server/lib/db.ts FALTANDO"

echo ""
echo "🎯 6. VERIFICANDO SCRIPTS DEPLOY:"
echo "---------------------------------"
[ -f deploy-local-simple.sh ] && echo "✅ deploy-local-simple.sh" || echo "❌ deploy-local-simple.sh FALTANDO"
[ -f start-simple.sh ] && echo "✅ start-simple.sh" || echo "❌ start-simple.sh FALTANDO"
[ -f docker-compose.prod.yml ] && echo "✅ docker-compose.prod.yml" || echo "❌ docker-compose.prod.yml FALTANDO"
[ -f Dockerfile ] && echo "✅ Dockerfile" || echo "❌ Dockerfile FALTANDO"

echo ""
echo "📄 7. VERIFICANDO ARQUIVOS DE AMBIENTE:"
echo "---------------------------------------"
[ -f .env ] && echo "✅ .env" || echo "❌ .env FALTANDO"
[ -f .env.production ] && echo "✅ .env.production" || echo "❌ .env.production FALTANDO"

echo ""
echo "🔍 8. DIAGNÓSTICO FINAL:"
echo "------------------------"

MISSING_COUNT=0

# Verificar arquivos críticos
CRITICAL_FILES=(
    "package.json"
    "server/index.ts" 
    "server/production.ts"
    "dist/server/production.js"
    "dist/spa/index.html"
)

echo "📋 Arquivos críticos:"
for file in "${CRITICAL_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ CRÍTICO: $file FALTANDO"
        ((MISSING_COUNT++))
    else
        echo "✅ $file"
    fi
done

echo ""
if [ $MISSING_COUNT -eq 0 ]; then
    echo "🎉 DIAGNÓSTICO: Todos os arquivos críticos estão presentes!"
    echo "💡 Se ainda há problemas, execute: npm run build"
else
    echo "⚠️  DIAGNÓSTICO: $MISSING_COUNT arquivo(s) crítico(s) faltando"
    echo "💡 Execute: npm install && npm run build"
fi

echo ""
echo "🚀 PRÓXIMOS PASSOS RECOMENDADOS:"
echo "--------------------------------"
echo "1. npm install (se node_modules faltando)"
echo "2. npm run build (se dist/ faltando)"
echo "3. chmod +x start-simple.sh && ./start-simple.sh"
echo ""
