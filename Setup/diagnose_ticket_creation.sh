#!/bin/bash

################################################################################
# Script de Diagnóstico - Problema na Criação de Tickets
# Autor: Sistema FluxDesk
# Descrição: Verifica todas as possíveis causas de falha na criação de tickets
################################################################################

echo "=================================================="
echo "🔧 DIAGNÓSTICO: CRIAÇÃO DE TICKETS"
echo "=================================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Diretório da aplicação
APP_DIR="/var/www/fluxdesk/current"

# Função para verificar se comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Verificar se está rodando no diretório correto
if [ ! -d "$APP_DIR" ]; then
    echo -e "${RED}❌ Erro: Diretório $APP_DIR não encontrado${NC}"
    echo "Execute este script no servidor de produção"
    exit 1
fi

cd "$APP_DIR"

echo -e "${BLUE}📁 Diretório da aplicação: $APP_DIR${NC}"
echo ""

################################################################################
# 1. VERIFICAR LOGS DO LARAVEL
################################################################################
echo "=================================================="
echo "1️⃣  VERIFICANDO LOGS DO LARAVEL"
echo "=================================================="

if [ -f "storage/logs/laravel.log" ]; then
    echo -e "${GREEN}✅ Arquivo de log encontrado${NC}"
    
    # Verificar últimas linhas do log
    echo ""
    echo "📋 Últimas 20 linhas do log:"
    echo "---"
    tail -20 storage/logs/laravel.log
    echo "---"
    echo ""
    
    # Verificar erros recentes
    echo "🔍 Procurando por erros recentes..."
    RECENT_ERRORS=$(grep -i "ERROR\|EXCEPTION\|FAILED" storage/logs/laravel.log | tail -5)
    
    if [ -z "$RECENT_ERRORS" ]; then
        echo -e "${GREEN}✅ Nenhum erro recente encontrado${NC}"
    else
        echo -e "${YELLOW}⚠️  Erros encontrados:${NC}"
        echo "$RECENT_ERRORS"
    fi
    
    echo ""
    
    # Verificar logs de criação de ticket
    echo "🔍 Procurando por logs de criação de ticket..."
    TICKET_LOGS=$(grep "CRIAÇÃO DE TICKET\|Ticket criado com sucesso\|VALIDAÇÃO FALHOU" storage/logs/laravel.log | tail -5)
    
    if [ -z "$TICKET_LOGS" ]; then
        echo -e "${YELLOW}⚠️  Nenhum log de criação de ticket encontrado (pode indicar que a requisição não chegou ao backend)${NC}"
    else
        echo -e "${GREEN}✅ Logs de criação encontrados:${NC}"
        echo "$TICKET_LOGS"
    fi
else
    echo -e "${RED}❌ Arquivo storage/logs/laravel.log não encontrado${NC}"
fi

echo ""

################################################################################
# 2. VERIFICAR PRIORIDADES NO BANCO
################################################################################
echo "=================================================="
echo "2️⃣  VERIFICANDO PRIORIDADES NO BANCO DE DADOS"
echo "=================================================="

# Verificar se psql está disponível
if command_exists psql; then
    # Buscar credenciais do .env
    if [ -f ".env" ]; then
        DB_NAME=$(grep "^DB_DATABASE=" .env | cut -d '=' -f2)
        DB_USER=$(grep "^DB_USERNAME=" .env | cut -d '=' -f2)
        
        echo "📊 Banco: $DB_NAME | Usuário: $DB_USER"
        echo ""
        
        # Contar prioridades
        PRIORITY_COUNT=$(sudo -u postgres psql -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM priorities;" 2>/dev/null | xargs)
        
        if [ -n "$PRIORITY_COUNT" ] && [ "$PRIORITY_COUNT" -gt 0 ]; then
            echo -e "${GREEN}✅ Total de prioridades cadastradas: $PRIORITY_COUNT${NC}"
            
            # Listar prioridades
            echo ""
            echo "📋 Prioridades cadastradas:"
            sudo -u postgres psql -d "$DB_NAME" -c "
                SELECT p.id, p.name, p.service_id, s.name as service_name, p.tenant_id
                FROM priorities p
                JOIN services s ON s.id = p.service_id
                ORDER BY p.service_id, p.name;
            " 2>/dev/null
        else
            echo -e "${RED}❌ PROBLEMA CRÍTICO: Nenhuma prioridade encontrada no banco!${NC}"
            echo ""
            echo -e "${YELLOW}📝 Solução: Execute o seguinte comando para criar prioridades:${NC}"
            echo "   cd $APP_DIR"
            echo "   php artisan tinker"
            echo ""
            echo "   E cole o código do arquivo TROUBLESHOOTING-TICKET-CREATION.md"
        fi
        
        # Verificar prioridades por tenant
        echo ""
        echo "🏢 Prioridades por Tenant:"
        sudo -u postgres psql -d "$DB_NAME" -c "
            SELECT tenant_id, COUNT(*) as total_priorities
            FROM priorities
            GROUP BY tenant_id;
        " 2>/dev/null
        
    else
        echo -e "${RED}❌ Arquivo .env não encontrado${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  PostgreSQL CLI não disponível. Verificação manual necessária.${NC}"
fi

echo ""

################################################################################
# 3. VERIFICAR PERMISSÕES DE ARQUIVOS
################################################################################
echo "=================================================="
echo "3️⃣  VERIFICANDO PERMISSÕES DE ARQUIVOS"
echo "=================================================="

# Verificar storage
if [ -d "storage" ]; then
    STORAGE_OWNER=$(stat -c '%U:%G' storage)
    STORAGE_PERMS=$(stat -c '%a' storage)
    
    if [ "$STORAGE_OWNER" == "www-data:www-data" ] && [ "$STORAGE_PERMS" == "775" ]; then
        echo -e "${GREEN}✅ Permissões de storage corretas${NC}"
    else
        echo -e "${YELLOW}⚠️  Permissões de storage: $STORAGE_OWNER ($STORAGE_PERMS)${NC}"
        echo "   Esperado: www-data:www-data (775)"
        echo ""
        echo "   Corrigir com:"
        echo "   sudo chown -R www-data:www-data storage bootstrap/cache"
        echo "   sudo chmod -R 775 storage bootstrap/cache"
    fi
fi

# Verificar bootstrap/cache
if [ -d "bootstrap/cache" ]; then
    CACHE_OWNER=$(stat -c '%U:%G' bootstrap/cache)
    CACHE_PERMS=$(stat -c '%a' bootstrap/cache)
    
    if [ "$CACHE_OWNER" == "www-data:www-data" ] && [ "$CACHE_PERMS" == "775" ]; then
        echo -e "${GREEN}✅ Permissões de cache corretas${NC}"
    else
        echo -e "${YELLOW}⚠️  Permissões de cache: $CACHE_OWNER ($CACHE_PERMS)${NC}"
    fi
fi

# Verificar storage link
if [ -L "public/storage" ]; then
    echo -e "${GREEN}✅ Storage link existe${NC}"
else
    echo -e "${YELLOW}⚠️  Storage link não encontrado${NC}"
    echo "   Criar com: php artisan storage:link"
fi

echo ""

################################################################################
# 4. VERIFICAR CONFIGURAÇÃO DO AMBIENTE
################################################################################
echo "=================================================="
echo "4️⃣  VERIFICANDO CONFIGURAÇÃO DO AMBIENTE"
echo "=================================================="

if [ -f ".env" ]; then
    APP_ENV=$(grep "^APP_ENV=" .env | cut -d '=' -f2)
    APP_DEBUG=$(grep "^APP_DEBUG=" .env | cut -d '=' -f2)
    APP_URL=$(grep "^APP_URL=" .env | cut -d '=' -f2)
    
    echo "🌍 Ambiente: $APP_ENV"
    echo "🐛 Debug: $APP_DEBUG"
    echo "🔗 URL: $APP_URL"
    echo ""
    
    if [ "$APP_ENV" == "production" ] && [ "$APP_DEBUG" == "true" ]; then
        echo -e "${YELLOW}⚠️  APP_DEBUG está ativado em produção! Recomendado: false${NC}"
    else
        echo -e "${GREEN}✅ Configuração de ambiente adequada${NC}"
    fi
else
    echo -e "${RED}❌ Arquivo .env não encontrado${NC}"
fi

echo ""

################################################################################
# 5. VERIFICAR SERVIÇOS
################################################################################
echo "=================================================="
echo "5️⃣  VERIFICANDO SERVIÇOS"
echo "=================================================="

# Verificar Nginx
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Nginx está rodando${NC}"
    
    # Verificar erros recentes do Nginx
    if [ -f "/var/log/nginx/fluxdesk_error.log" ]; then
        NGINX_ERRORS=$(sudo tail -10 /var/log/nginx/fluxdesk_error.log 2>/dev/null)
        if [ -n "$NGINX_ERRORS" ]; then
            echo -e "${YELLOW}⚠️  Erros recentes do Nginx encontrados${NC}"
        fi
    fi
else
    echo -e "${RED}❌ Nginx NÃO está rodando${NC}"
fi

# Verificar PHP-FPM
if systemctl is-active --quiet php8.3-fpm; then
    echo -e "${GREEN}✅ PHP-FPM está rodando${NC}"
else
    echo -e "${RED}❌ PHP-FPM NÃO está rodando${NC}"
fi

# Verificar PostgreSQL
if systemctl is-active --quiet postgresql; then
    echo -e "${GREEN}✅ PostgreSQL está rodando${NC}"
else
    echo -e "${RED}❌ PostgreSQL NÃO está rodando${NC}"
fi

echo ""

################################################################################
# 6. VERIFICAR VERSÕES
################################################################################
echo "=================================================="
echo "6️⃣  VERIFICANDO VERSÕES"
echo "=================================================="

# PHP
if command_exists php; then
    PHP_VERSION=$(php -v | head -n 1)
    echo "🐘 $PHP_VERSION"
fi

# Laravel
if [ -f "artisan" ]; then
    LARAVEL_VERSION=$(php artisan --version)
    echo "🔧 $LARAVEL_VERSION"
fi

# Nginx
if command_exists nginx; then
    NGINX_VERSION=$(nginx -v 2>&1 | head -n 1)
    echo "🌐 $NGINX_VERSION"
fi

# PostgreSQL
if command_exists psql; then
    PSQL_VERSION=$(psql --version)
    echo "🐘 $PSQL_VERSION"
fi

echo ""

################################################################################
# 7. VERIFICAR CACHE E OTIMIZAÇÕES
################################################################################
echo "=================================================="
echo "7️⃣  VERIFICANDO CACHE E OTIMIZAÇÕES"
echo "=================================================="

if [ -f "bootstrap/cache/config.php" ]; then
    echo -e "${GREEN}✅ Config cache existe${NC}"
else
    echo -e "${YELLOW}⚠️  Config cache não existe (pode impactar performance)${NC}"
fi

if [ -f "bootstrap/cache/routes-v7.php" ]; then
    echo -e "${GREEN}✅ Route cache existe${NC}"
else
    echo -e "${YELLOW}⚠️  Route cache não existe${NC}"
fi

echo ""

################################################################################
# RESUMO E RECOMENDAÇÕES
################################################################################
echo "=================================================="
echo "📊 RESUMO E RECOMENDAÇÕES"
echo "=================================================="
echo ""

echo -e "${BLUE}🔍 Para continuar o diagnóstico:${NC}"
echo ""
echo "1. Verificar console do navegador (F12):"
echo "   - Deve aparecer: '🚀 Iniciando submit do ticket...'"
echo "   - Se não aparecer: problema no JavaScript"
echo "   - Se aparecer erro: copiar mensagem completa"
echo ""
echo "2. Monitorar logs em tempo real:"
echo "   tail -f storage/logs/laravel.log"
echo ""
echo "3. Se a causa for prioridades ausentes:"
echo "   Ver arquivo: Setup/TROUBLESHOOTING-TICKET-CREATION.md"
echo ""
echo "4. Limpar todos os caches:"
echo "   php artisan config:clear"
echo "   php artisan cache:clear"
echo "   php artisan view:clear"
echo "   php artisan route:clear"
echo ""
echo "5. Reiniciar serviços:"
echo "   sudo systemctl restart php8.3-fpm"
echo "   sudo systemctl reload nginx"
echo ""

echo -e "${GREEN}✅ Diagnóstico concluído!${NC}"
echo "=================================================="
