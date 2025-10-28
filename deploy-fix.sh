#!/bin/bash

################################################################################
# FLUXDESK - Deploy Rápido da Correção de E-mail
# Descrição: Atualiza código, recompila assets e aplica migrations
################################################################################

set -e

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   Fluxdesk - Deploy de Correção${NC}"
echo -e "${GREEN}========================================${NC}\n"

# 1. Entrar na aplicação
echo -e "${YELLOW}[1/8]${NC} Acessando diretório da aplicação..."
cd /var/www/fluxdesk/current || {
    echo -e "${RED}Erro: Diretório /var/www/fluxdesk/current não encontrado${NC}"
    exit 1
}

# 2. Colocar aplicação em modo de manutenção
echo -e "${YELLOW}[2/8]${NC} Ativando modo de manutenção..."
php artisan down --render="errors::503" --retry=60 || true

# 3. Atualizar código do repositório
echo -e "${YELLOW}[3/8]${NC} Atualizando código do Git..."
git fetch origin
git reset --hard origin/main

# 4. Instalar dependências PHP (se houver novas)
echo -e "${YELLOW}[4/8]${NC} Verificando dependências PHP..."
composer install --no-dev --optimize-autoloader --no-interaction

# 5. Instalar dependências Node (se houver novas)
echo -e "${YELLOW}[5/8]${NC} Verificando dependências Node..."
pnpm install --frozen-lockfile

# 6. Compilar assets do frontend
echo -e "${YELLOW}[6/8]${NC} Compilando assets do frontend..."
pnpm build

# 7. Executar migrations
echo -e "${YELLOW}[7/8]${NC} Executando migrations..."
php artisan migrate --force

# 8. Limpar e otimizar cache
echo -e "${YELLOW}[8/8]${NC} Otimizando aplicação..."
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 9. Retirar aplicação do modo de manutenção
echo -e "${GREEN}Desativando modo de manutenção...${NC}"
php artisan up

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}   ✅ Deploy concluído com sucesso!${NC}"
echo -e "${GREEN}========================================${NC}\n"

echo -e "${YELLOW}Próximos passos:${NC}"
echo "1. Acesse o site e pressione Ctrl+Shift+R para limpar cache do navegador"
echo "2. Teste a funcionalidade de adicionar e-mail"
echo ""

