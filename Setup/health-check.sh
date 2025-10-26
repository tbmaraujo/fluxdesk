#!/bin/bash

################################################################################
# FLUXDESK - Script de Health Check
# Descrição: Verifica saúde da aplicação e serviços
# Uso: bash health-check.sh
################################################################################

set -eo pipefail

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Contadores
PASSED=0
FAILED=0
WARNINGS=0

# ============================
# FUNÇÕES AUXILIARES
# ============================

pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# ============================
# CHECKS
# ============================

echo ""
echo "========================================"
echo "  FLUXDESK - Health Check"
echo "========================================"
echo ""

# 1. Sistema Operacional
info "1. Verificando Sistema Operacional..."
if [ -f /etc/os-release ]; then
    OS_VERSION=$(grep PRETTY_NAME /etc/os-release | cut -d '"' -f 2)
    pass "OS: $OS_VERSION"
else
    warn "Não foi possível detectar versão do SO"
fi
echo ""

# 2. Nginx
info "2. Verificando Nginx..."
if systemctl is-active --quiet nginx; then
    NGINX_VERSION=$(nginx -v 2>&1 | cut -d '/' -f 2)
    pass "Nginx $NGINX_VERSION rodando"
else
    fail "Nginx NÃO está rodando"
fi
echo ""

# 3. PHP-FPM
info "3. Verificando PHP-FPM..."
if systemctl is-active --quiet php8.3-fpm; then
    PHP_VERSION=$(php -v | head -n 1 | cut -d ' ' -f 2)
    pass "PHP-FPM $PHP_VERSION rodando"
else
    fail "PHP-FPM NÃO está rodando"
fi
echo ""

# 4. PostgreSQL (verificar se consegue conectar)
info "4. Verificando PostgreSQL..."
if command -v psql &> /dev/null; then
    # Tentar conexão (assumindo localhost)
    if pg_isready -h 127.0.0.1 -p 5432 &> /dev/null; then
        pass "PostgreSQL respondendo"
    else
        warn "PostgreSQL não está respondendo em 127.0.0.1:5432 (pode ser RDS externo)"
    fi
else
    warn "PostgreSQL client não instalado (pode estar usando RDS)"
fi
echo ""

# 5. Estrutura de diretórios
info "5. Verificando Estrutura de Diretórios..."
if [ -d "/var/www/fluxdesk" ]; then
    pass "Diretório principal existe"
    
    if [ -L "/var/www/fluxdesk/current" ]; then
        CURRENT_RELEASE=$(readlink /var/www/fluxdesk/current | xargs basename)
        pass "Symlink 'current' → $CURRENT_RELEASE"
    else
        fail "Symlink 'current' não existe"
    fi
    
    if [ -d "/var/www/fluxdesk/shared" ]; then
        pass "Diretório 'shared' existe"
    else
        fail "Diretório 'shared' não existe"
    fi
    
    if [ -d "/var/www/fluxdesk/releases" ]; then
        RELEASES_COUNT=$(ls -1 /var/www/fluxdesk/releases 2>/dev/null | wc -l)
        pass "Diretório 'releases' existe ($RELEASES_COUNT releases)"
    else
        fail "Diretório 'releases' não existe"
    fi
else
    fail "Diretório /var/www/fluxdesk NÃO existe"
fi
echo ""

# 6. Arquivo .env
info "6. Verificando Arquivo .env..."
if [ -f "/var/www/fluxdesk/shared/.env" ]; then
    pass "Arquivo .env existe"
    
    if grep -q "APP_KEY=base64:" /var/www/fluxdesk/shared/.env; then
        pass "APP_KEY configurada"
    else
        fail "APP_KEY NÃO configurada"
    fi
    
    if grep -q "APP_ENV=production" /var/www/fluxdesk/shared/.env; then
        pass "APP_ENV=production"
    else
        warn "APP_ENV não está como 'production'"
    fi
    
    if grep -q "APP_DEBUG=false" /var/www/fluxdesk/shared/.env; then
        pass "APP_DEBUG=false"
    else
        fail "APP_DEBUG NÃO está como 'false' (RISCO DE SEGURANÇA!)"
    fi
else
    fail "Arquivo .env NÃO existe"
fi
echo ""

# 7. Permissões
info "7. Verificando Permissões..."
if [ -d "/var/www/fluxdesk/shared/storage" ]; then
    STORAGE_OWNER=$(stat -c '%U' /var/www/fluxdesk/shared/storage)
    if [ "$STORAGE_OWNER" = "www-data" ]; then
        pass "Storage com owner correto (www-data)"
    else
        fail "Storage com owner incorreto ($STORAGE_OWNER, deveria ser www-data)"
    fi
    
    if [ -w "/var/www/fluxdesk/shared/storage/logs" ]; then
        pass "Storage/logs com permissão de escrita"
    else
        fail "Storage/logs SEM permissão de escrita"
    fi
else
    fail "Diretório storage não existe"
fi
echo ""

# 8. HTTP Response
info "8. Verificando Resposta HTTP..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    pass "Aplicação respondendo HTTP 200"
else
    fail "Aplicação retornou HTTP $HTTP_CODE"
fi
echo ""

# 9. Verificar Dev-server (Vite)
info "9. Verificando Build de Produção..."
HTML_CONTENT=$(curl -s http://127.0.0.1 2>/dev/null || echo "")
if echo "$HTML_CONTENT" | grep -qE "5173|@vite/client|react-refresh"; then
    fail "ERRO CRÍTICO: Dev-server detectado! Build de produção FALHOU!"
else
    pass "Build de produção OK (sem dev-server)"
fi
echo ""

# 10. Assets compilados
info "10. Verificando Assets Compilados..."
if [ -d "/var/www/fluxdesk/current/public/build" ]; then
    if [ -f "/var/www/fluxdesk/current/public/build/manifest.json" ]; then
        pass "Assets compilados (manifest.json encontrado)"
    else
        fail "manifest.json NÃO encontrado (build incompleto)"
    fi
else
    fail "Diretório public/build NÃO existe"
fi
echo ""

# 11. Composer Dependencies
info "11. Verificando Dependências Composer..."
if [ -d "/var/www/fluxdesk/current/vendor" ]; then
    pass "Vendor (Composer) instalado"
else
    fail "Vendor NÃO instalado"
fi
echo ""

# 12. Cloudflared (opcional)
info "12. Verificando Cloudflare Tunnel..."
if systemctl is-active --quiet cloudflared 2>/dev/null; then
    pass "Cloudflared rodando"
else
    warn "Cloudflared NÃO está rodando (pode estar OK se não usar)"
fi
echo ""

# 13. Supervisor (queue workers)
info "13. Verificando Queue Workers..."
if command -v supervisorctl &> /dev/null; then
    if supervisorctl status fluxdesk-worker:* 2>/dev/null | grep -q RUNNING; then
        WORKERS_COUNT=$(supervisorctl status fluxdesk-worker:* 2>/dev/null | grep -c RUNNING)
        pass "Supervisor workers rodando ($WORKERS_COUNT workers)"
    else
        warn "Supervisor workers NÃO estão rodando (pode estar OK se não usar filas)"
    fi
else
    warn "Supervisor não instalado (pode estar OK se não usar filas)"
fi
echo ""

# 14. Espaço em disco
info "14. Verificando Espaço em Disco..."
DISK_USAGE=$(df -h /var/www/fluxdesk | tail -n 1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 80 ]; then
    pass "Espaço em disco OK (${DISK_USAGE}% usado)"
elif [ "$DISK_USAGE" -lt 90 ]; then
    warn "Espaço em disco alto (${DISK_USAGE}% usado)"
else
    fail "Espaço em disco CRÍTICO (${DISK_USAGE}% usado)"
fi
echo ""

# 15. Logs recentes
info "15. Verificando Logs..."
if [ -f "/var/www/fluxdesk/shared/storage/logs/laravel.log" ]; then
    ERROR_COUNT=$(tail -n 100 /var/www/fluxdesk/shared/storage/logs/laravel.log 2>/dev/null | grep -ci "error" || echo 0)
    if [ "$ERROR_COUNT" -eq 0 ]; then
        pass "Sem erros recentes no log (últimas 100 linhas)"
    else
        warn "$ERROR_COUNT erros encontrados nas últimas 100 linhas do log"
    fi
else
    warn "Arquivo de log não encontrado (pode estar OK se aplicação acabou de iniciar)"
fi
echo ""

# ============================
# RESUMO
# ============================

echo "========================================"
echo "  RESUMO DO HEALTH CHECK"
echo "========================================"
echo -e "${GREEN}✓ Passed:${NC}   $PASSED"
echo -e "${YELLOW}⚠ Warnings:${NC} $WARNINGS"
echo -e "${RED}✗ Failed:${NC}   $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        echo -e "${GREEN}🎉 Sistema totalmente saudável!${NC}"
        exit 0
    else
        echo -e "${YELLOW}⚠️  Sistema funcionando com avisos${NC}"
        exit 0
    fi
else
    echo -e "${RED}❌ Sistema com problemas! Verifique os erros acima.${NC}"
    exit 1
fi
