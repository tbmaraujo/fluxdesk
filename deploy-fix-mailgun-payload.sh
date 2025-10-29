#!/bin/bash

################################################################################
# FLUXDESK - Deploy da Correção do Payload Mailgun
# Descrição: Corrige processamento de e-mails do Mailgun (suporte a ambos formatos)
# Data: 2025-10-29
################################################################################

set -e

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   Fluxdesk - Fix Mailgun Payload${NC}"
echo -e "${GREEN}========================================${NC}\n"

echo -e "${YELLOW}Correção implementada:${NC}"
echo "- EmailInboundService agora detecta automaticamente formato Mailgun vs SES"
echo "- Adiciona método processMailgunEmail() específico para payload do Mailgun"
echo "- Mantém compatibilidade com SES através do método processSESEmail()"
echo ""

# 1. Entrar na aplicação
echo -e "${YELLOW}[1/8]${NC} Acessando diretório da aplicação..."
cd /var/www/fluxdesk/current || {
    echo -e "${RED}Erro: Diretório /var/www/fluxdesk/current não encontrado${NC}"
    exit 1
}

# 2. Fazer backup do arquivo atual
echo -e "${YELLOW}[2/8]${NC} Criando backup do serviço..."
cp app/Services/EmailInboundService.php app/Services/EmailInboundService.php.backup-$(date +%Y%m%d-%H%M%S) || true

# 3. Atualizar código do repositório
echo -e "${YELLOW}[3/8]${NC} Atualizando código do Git..."
git fetch origin
git reset --hard origin/main

# 4. Verificar se há novas dependências
echo -e "${YELLOW}[4/8]${NC} Verificando dependências..."
composer install --no-dev --optimize-autoloader --no-interaction

# 5. Limpar cache do Laravel
echo -e "${YELLOW}[5/8]${NC} Limpando cache..."
php artisan config:clear
php artisan route:clear
php artisan cache:clear

# 6. Reotimizar
echo -e "${YELLOW}[6/8]${NC} Otimizando aplicação..."
php artisan config:cache
php artisan route:cache

# 7. Reiniciar queue workers (IMPORTANTE para esta correção)
echo -e "${YELLOW}[7/8]${NC} Reiniciando queue workers..."
if command -v supervisorctl &> /dev/null; then
    sudo supervisorctl restart fluxdesk-worker:* || echo -e "${YELLOW}⚠️  Supervisor não encontrado ou sem workers configurados${NC}"
else
    echo -e "${YELLOW}⚠️  Supervisor não instalado. Execute manualmente: php artisan queue:restart${NC}"
    php artisan queue:restart
fi

# 8. Verificar logs recentes
echo -e "${YELLOW}[8/8]${NC} Verificando últimos logs..."
echo -e "${YELLOW}Últimas 10 linhas do log:${NC}"
tail -n 10 storage/logs/laravel.log

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}   ✅ Deploy concluído com sucesso!${NC}"
echo -e "${GREEN}========================================${NC}\n"

echo -e "${YELLOW}Teste a correção:${NC}"
echo "1. Envie um e-mail de teste para um tenant válido"
echo "   Exemplo: SEU_TENANT_SLUG@tickets.fluxdesk.com.br"
echo ""
echo "2. Monitore os logs em tempo real:"
echo "   tail -f storage/logs/laravel.log | grep -E '(Mailgun|tenant_id|EmailIngest)'"
echo ""
echo "3. Verifique a fila:"
echo "   php artisan queue:work --once --verbose"
echo ""
echo -e "${YELLOW}Procure nos logs:${NC}"
echo "  ✅ 'Processando e-mail do Mailgun' (se detectou Mailgun)"
echo "  ✅ 'Email do Mailgun parseado' (se parseou corretamente)"
echo "  ✅ 'Tenant identificado' (se encontrou o tenant)"
echo "  ✅ 'Novo ticket enfileirado' ou 'Ticket criado'"
echo ""


