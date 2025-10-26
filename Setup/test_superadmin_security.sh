#!/bin/bash

###############################################################################
# Script de Teste: Verificação de Segurança Super Admin
# 
# Este script testa se a correção de segurança está funcionando corretamente,
# verificando:
# 1. Middleware está registrado
# 2. Rotas estão protegidas
# 3. Logs de segurança estão funcionando
###############################################################################

echo "🔒 TESTE DE SEGURANÇA: Isolamento Super Admin"
echo "=============================================="
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contador de testes
PASSED=0
FAILED=0

# Função para testar
test_check() {
    local test_name=$1
    local command=$2
    
    echo -n "🧪 $test_name... "
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASSOU${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FALHOU${NC}"
        ((FAILED++))
        return 1
    fi
}

echo "📋 1. Verificando Arquivos"
echo "─────────────────────────────"

test_check "Middleware PreventSuperAdminAccess existe" \
    "test -f app/Http/Middleware/PreventSuperAdminAccess.php"

test_check "Documentação de segurança existe" \
    "test -f Setup/SECURITY-FIX-SUPERADMIN.md"

echo ""
echo "📋 2. Verificando Middleware Registrado"
echo "─────────────────────────────────────────"

test_check "Middleware registrado em bootstrap/app.php" \
    "grep -q \"prevent.superadmin\" bootstrap/app.php"

echo ""
echo "📋 3. Verificando Proteção de Rotas"
echo "──────────────────────────────────────"

test_check "Dashboard protegido" \
    "grep -B 2 -A 2 'name.*dashboard' routes/web.php | grep -q 'prevent.superadmin'"

test_check "Rotas operacionais protegidas" \
    "grep -A 1 \"middleware.*prevent.superadmin.*identify.tenant\" routes/web.php | grep -q \"group\""

test_check "Rota raiz redireciona Super Admin" \
    "grep -A 5 'Route::get.*\"/\"' routes/web.php | grep -q \"isSuperAdmin\""

echo ""
echo "📋 4. Verificando Sintaxe PHP"
echo "────────────────────────────────"

test_check "Sintaxe do Middleware está correta" \
    "php -l app/Http/Middleware/PreventSuperAdminAccess.php"

test_check "Sintaxe de rotas está correta" \
    "php -l routes/web.php"

test_check "Sintaxe de bootstrap está correta" \
    "php -l bootstrap/app.php"

echo ""
echo "📋 5. Verificando Cache de Rotas"
echo "───────────────────────────────────"

if [ -f bootstrap/cache/routes-v7.php ]; then
    echo -e "${YELLOW}⚠ Cache de rotas detectado${NC}"
    echo "  Execute: php artisan route:clear"
    echo "  Depois: php artisan route:cache"
else
    echo -e "${GREEN}✓ Sem cache de rotas antigo${NC}"
fi

echo ""
echo "📋 6. Verificando Lógica do Middleware"
echo "────────────────────────────────────────"

test_check "Middleware verifica isSuperAdmin()" \
    "grep -q \"isSuperAdmin()\" app/Http/Middleware/PreventSuperAdminAccess.php"

test_check "Middleware registra em log" \
    "grep -q \"Log::warning\" app/Http/Middleware/PreventSuperAdminAccess.php"

test_check "Middleware redireciona para painel correto" \
    "grep -q \"superadmin.tenants.index\" app/Http/Middleware/PreventSuperAdminAccess.php"

test_check "Middleware exibe mensagem de erro" \
    "grep -q \"with('error'\" app/Http/Middleware/PreventSuperAdminAccess.php"

echo ""
echo "═══════════════════════════════════════════"
echo "📊 RESULTADO DOS TESTES"
echo "═══════════════════════════════════════════"
echo -e "Testes passaram: ${GREEN}$PASSED${NC}"
echo -e "Testes falharam: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ TODOS OS TESTES PASSARAM!${NC}"
    echo ""
    echo "🚀 Próximos Passos:"
    echo "  1. Execute: php artisan route:clear"
    echo "  2. Execute: php artisan config:clear"
    echo "  3. Execute: php artisan cache:clear"
    echo "  4. Teste manualmente fazendo login como Super Admin"
    echo "  5. Verifique os logs em: storage/logs/laravel.log"
    echo ""
    exit 0
else
    echo -e "${RED}❌ ALGUNS TESTES FALHARAM${NC}"
    echo ""
    echo "Por favor, verifique os erros acima e corrija antes de fazer deploy."
    echo ""
    exit 1
fi
