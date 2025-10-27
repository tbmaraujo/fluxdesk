#!/bin/bash

# Script para verificar e mostrar informações do ambiente
# Execute: bash CHECK-ENV-PATHS.sh (não precisa sudo)

echo "================================================"
echo "Verificação de Caminhos e Configurações"
echo "================================================"
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Detectar diretório da aplicação
echo -e "${YELLOW}[1] Detectando diretório da aplicação...${NC}"
if [ -d "/var/www/fluxdesk/current" ]; then
    APP_DIR="/var/www/fluxdesk/current"
    echo -e "${GREEN}✓ Encontrado: $APP_DIR${NC}"
elif [ -d "/var/www/fluxdesk" ]; then
    APP_DIR="/var/www/fluxdesk"
    echo -e "${GREEN}✓ Encontrado: $APP_DIR${NC}"
else
    echo -e "${RED}✗ Diretório da aplicação não encontrado!${NC}"
    exit 1
fi
echo ""

# Verificar estrutura
echo -e "${YELLOW}[2] Verificando estrutura de diretórios...${NC}"
echo "Diretórios em $APP_DIR:"
ls -la "$APP_DIR" | grep -E "(storage|artisan|.env)"
echo ""

# Verificar .env
echo -e "${YELLOW}[3] Verificando .env...${NC}"
if [ -f "$APP_DIR/.env" ]; then
    echo -e "${GREEN}✓ Arquivo .env existe${NC}"
    echo ""
    echo "Variáveis importantes:"
    grep -E "(QUEUE_CONNECTION|AWS_BUCKET|AWS_SES_S3_BUCKET|SES_SNS_TOPIC_ARN|SES_WEBHOOK_SECRET)" "$APP_DIR/.env" || echo "Nenhuma variável encontrada"
else
    echo -e "${RED}✗ Arquivo .env não encontrado!${NC}"
fi
echo ""

# Verificar storage/logs
echo -e "${YELLOW}[4] Verificando diretório de logs...${NC}"
if [ -d "$APP_DIR/storage/logs" ]; then
    echo -e "${GREEN}✓ Diretório existe: $APP_DIR/storage/logs${NC}"
    echo ""
    echo "Arquivos de log:"
    ls -lah "$APP_DIR/storage/logs/" | tail -10
    echo ""
    echo "Permissões:"
    ls -ld "$APP_DIR/storage/logs"
else
    echo -e "${RED}✗ Diretório de logs não existe!${NC}"
    echo "Criando diretório..."
    sudo mkdir -p "$APP_DIR/storage/logs"
    sudo chown -R www-data:www-data "$APP_DIR/storage"
    echo -e "${GREEN}✓ Diretório criado${NC}"
fi
echo ""

# Verificar Redis
echo -e "${YELLOW}[5] Verificando Redis...${NC}"
if redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Redis está rodando${NC}"
    redis-cli ping
else
    echo -e "${RED}✗ Redis não está respondendo${NC}"
fi
echo ""

# Verificar Supervisor/Workers
echo -e "${YELLOW}[6] Verificando workers...${NC}"
sudo supervisorctl status 2>/dev/null || echo "Supervisor não está configurado ou não está rodando"
echo ""

# Testar Laravel
echo -e "${YELLOW}[7] Testando Laravel Artisan...${NC}"
cd "$APP_DIR"
php artisan --version 2>/dev/null || echo "Erro ao executar artisan"
echo ""

# Resumo
echo "================================================"
echo -e "${GREEN}Resumo${NC}"
echo "================================================"
echo ""
echo "Diretório da aplicação: $APP_DIR"
echo "Arquivo .env: $([ -f "$APP_DIR/.env" ] && echo '✓ Existe' || echo '✗ Não encontrado')"
echo "Diretório de logs: $([ -d "$APP_DIR/storage/logs" ] && echo '✓ Existe' || echo '✗ Não encontrado')"
echo "Redis: $(redis-cli ping 2>/dev/null || echo 'Não está rodando')"
echo ""

echo "Comandos úteis:"
echo "  - Ver logs: tail -f $APP_DIR/storage/logs/laravel.log"
echo "  - Ver workers: sudo supervisorctl status"
echo "  - Testar queue: cd $APP_DIR && php artisan tinker"
echo ""

