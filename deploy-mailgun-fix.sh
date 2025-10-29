#!/bin/bash

################################################################################
# FLUXDESK - Deploy da Correção do Mailgun Webhook
# Descrição: Atualiza código e reinicia workers
################################################################################

set -e

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   Fluxdesk - Deploy Correção Mailgun${NC}"
echo -e "${GREEN}========================================${NC}\n"

# 1. Entrar na aplicação
echo -e "${YELLOW}[1/7]${NC} Acessando diretório da aplicação..."
cd /var/www/fluxdesk/current || {
    echo -e "${RED}Erro: Diretório /var/www/fluxdesk/current não encontrado${NC}"
    exit 1
}

# 2. Atualizar código do repositório
echo -e "${YELLOW}[2/7]${NC} Atualizando código do Git..."
git fetch origin
git reset --hard origin/main

# 3. Verificar se há novas dependências
echo -e "${YELLOW}[3/7]${NC} Verificando dependências..."
composer install --no-dev --optimize-autoloader --no-interaction

# 4. Limpar cache do Laravel
echo -e "${YELLOW}[4/7]${NC} Limpando cache..."
php artisan config:clear
php artisan route:clear
php artisan cache:clear

# 5. Reotimizar
echo -e "${YELLOW}[5/7]${NC} Otimizando aplicação..."
php artisan config:cache
php artisan route:cache

# 6. Reiniciar queue workers
echo -e "${YELLOW}[6/7]${NC} Reiniciando queue workers..."
if command -v supervisorctl &> /dev/null; then
    sudo supervisorctl restart fluxdesk-worker:* || echo -e "${YELLOW}⚠️  Supervisor não encontrado ou sem workers configurados${NC}"
else
    echo -e "${YELLOW}⚠️  Supervisor não instalado${NC}"
fi

# 7. Verificar logs
echo -e "${YELLOW}[7/7]${NC} Verificando últimos logs..."
tail -n 5 storage/logs/laravel.log

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}   ✅ Deploy concluído com sucesso!${NC}"
echo -e "${GREEN}========================================${NC}\n"

echo -e "${YELLOW}Próximos passos:${NC}"
echo "1. Teste o webhook do Mailgun novamente"
echo "2. Monitore os logs: tail -f storage/logs/laravel.log"
echo "3. Verifique a fila: php artisan queue:work --once"
echo ""

