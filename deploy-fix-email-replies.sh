#!/bin/bash
set -e

echo "🚀 Deploy: Fix Email Replies - Adicionando colunas necessárias"
echo "=============================================================="

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Diretório do projeto em produção
PROD_DIR="/var/www/fluxdesk/current"

echo -e "${YELLOW}1. Verificando estrutura atual da tabela replies...${NC}"
sudo -u www-data psql -U fluxdesk -d fluxdesk -c "\d replies"

echo ""
echo -e "${YELLOW}2. Executando migrations...${NC}"
cd "$PROD_DIR" && sudo -u www-data php artisan migrate --force

echo ""
echo -e "${YELLOW}3. Verificando colunas após migration...${NC}"
sudo -u www-data psql -U fluxdesk -d fluxdesk -c "SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'replies' AND column_name IN ('is_internal', 'from_email', 'from_name', 'via') ORDER BY ordinal_position;"

echo ""
echo -e "${YELLOW}4. Limpando cache do Laravel...${NC}"
cd "$PROD_DIR" && sudo -u www-data php artisan optimize:clear

echo ""
echo -e "${YELLOW}5. Reiniciando queue workers...${NC}"
sudo systemctl restart laravel-worker

echo ""
echo -e "${GREEN}✅ Deploy concluído com sucesso!${NC}"
echo ""
echo "Próximos passos:"
echo "  • Monitorar logs: tail -f $PROD_DIR/storage/logs/laravel.log"
echo "  • Testar resposta por e-mail: enviar e-mail para ticket existente"
echo "  • Verificar criação de replies no banco"

