#!/bin/bash

# Script para configurar Redis e Supervisor no servidor EC2
# Execute: sudo bash FIX-REDIS-SUPERVISOR.sh

set -e

echo "================================================"
echo "Configuração Redis + Supervisor para Fluxdesk"
echo "================================================"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ================================================
# 1. INSTALAR E CONFIGURAR REDIS
# ================================================

echo -e "${YELLOW}[1/6] Verificando Redis...${NC}"

if ! command -v redis-server &> /dev/null; then
    echo "Redis não encontrado. Instalando..."
    apt-get update
    apt-get install -y redis-server
else
    echo "Redis já está instalado."
fi

# Configurar Redis para iniciar automaticamente
echo "Habilitando Redis para iniciar no boot..."
systemctl enable redis-server

# Iniciar Redis
echo "Iniciando Redis..."
systemctl start redis-server

# Verificar status
echo "Verificando Redis..."
if redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Redis está rodando!${NC}"
else
    echo -e "${RED}✗ Erro: Redis não respondeu.${NC}"
    systemctl status redis-server
    exit 1
fi

echo ""

# ================================================
# 2. INSTALAR E CONFIGURAR SUPERVISOR
# ================================================

echo -e "${YELLOW}[2/6] Verificando Supervisor...${NC}"

if ! command -v supervisord &> /dev/null; then
    echo "Supervisor não encontrado. Instalando..."
    apt-get install -y supervisor
else
    echo "Supervisor já está instalado."
fi

# Habilitar e iniciar Supervisor
echo "Habilitando Supervisor..."
systemctl enable supervisor

echo "Iniciando Supervisor..."
systemctl start supervisor

# Verificar status
if systemctl is-active --quiet supervisor; then
    echo -e "${GREEN}✓ Supervisor está rodando!${NC}"
else
    echo -e "${RED}✗ Erro: Supervisor não está rodando.${NC}"
    systemctl status supervisor
    exit 1
fi

echo ""

# ================================================
# 3. CRIAR CONFIGURAÇÃO DO WORKER
# ================================================

echo -e "${YELLOW}[3/6] Configurando worker do Laravel...${NC}"

# Detectar diretório da aplicação
if [ -d "/var/www/fluxdesk/current" ]; then
    APP_DIR="/var/www/fluxdesk/current"
elif [ -d "/var/www/fluxdesk" ]; then
    APP_DIR="/var/www/fluxdesk"
else
    echo -e "${RED}✗ Erro: Diretório da aplicação não encontrado.${NC}"
    exit 1
fi

echo "Diretório da aplicação: $APP_DIR"

# Criar arquivo de configuração do Supervisor
SUPERVISOR_CONF="/etc/supervisor/conf.d/fluxdesk-worker.conf"

cat > $SUPERVISOR_CONF << 'EOF'
[program:fluxdesk-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/fluxdesk/current/artisan queue:work redis --sleep=3 --tries=3 --max-time=3600 --timeout=60
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/var/www/fluxdesk/current/storage/logs/worker.log
stopwaitsecs=3600
startsecs=0
EOF

# Ajustar path se necessário
sed -i "s|/var/www/fluxdesk/current|$APP_DIR|g" $SUPERVISOR_CONF

echo -e "${GREEN}✓ Configuração do worker criada: $SUPERVISOR_CONF${NC}"

echo ""

# ================================================
# 4. ATUALIZAR .ENV
# ================================================

echo -e "${YELLOW}[4/6] Atualizando .env...${NC}"

ENV_FILE="$APP_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}✗ Erro: Arquivo .env não encontrado em $ENV_FILE${NC}"
    exit 1
fi

# Backup do .env
cp "$ENV_FILE" "$ENV_FILE.backup.$(date +%Y%m%d_%H%M%S)"
echo "Backup criado: $ENV_FILE.backup.$(date +%Y%m%d_%H%M%S)"

# Atualizar QUEUE_CONNECTION
if grep -q "^QUEUE_CONNECTION=" "$ENV_FILE"; then
    sed -i 's/^QUEUE_CONNECTION=.*/QUEUE_CONNECTION=redis/' "$ENV_FILE"
    echo "✓ QUEUE_CONNECTION atualizado para redis"
else
    echo "QUEUE_CONNECTION=redis" >> "$ENV_FILE"
    echo "✓ QUEUE_CONNECTION adicionado"
fi

# Adicionar variáveis de e-mail inbound se não existirem
if ! grep -q "^AWS_SES_S3_BUCKET=" "$ENV_FILE"; then
    cat >> "$ENV_FILE" << 'ENVEOF'

# ================================================
# E-MAIL INBOUND (Recebimento de Tickets)
# ================================================
AWS_SES_S3_BUCKET=fluxdesk-emails-inbound
SES_SNS_TOPIC_ARN=
ENVEOF
    echo "✓ Variáveis de e-mail inbound adicionadas"
fi

# Atualizar AWS_BUCKET se estiver vazio
if grep -q "^AWS_BUCKET=$" "$ENV_FILE"; then
    sed -i 's/^AWS_BUCKET=$/AWS_BUCKET=fluxdesk-emails-inbound/' "$ENV_FILE"
    echo "✓ AWS_BUCKET atualizado"
fi

echo -e "${GREEN}✓ Arquivo .env atualizado${NC}"

echo ""

# ================================================
# 5. RECARREGAR CONFIGURAÇÕES
# ================================================

echo -e "${YELLOW}[5/6] Recarregando configurações...${NC}"

# Recarregar Supervisor
echo "Recarregando Supervisor..."
supervisorctl reread
supervisorctl update

# Iniciar workers
echo "Iniciando workers..."
supervisorctl start fluxdesk-worker:*

# Limpar caches do Laravel
echo "Limpando caches do Laravel..."
cd "$APP_DIR"
php artisan config:clear
php artisan cache:clear
php artisan queue:restart

echo -e "${GREEN}✓ Configurações recarregadas${NC}"

echo ""

# ================================================
# 6. VERIFICAR STATUS
# ================================================

echo -e "${YELLOW}[6/6] Verificando status final...${NC}"
echo ""

echo "=== Redis ==="
redis-cli ping
systemctl status redis-server --no-pager -l 0
echo ""

echo "=== Supervisor ==="
systemctl status supervisor --no-pager -l 0
echo ""

echo "=== Workers ==="
supervisorctl status fluxdesk-worker:*
echo ""

echo "=== Queue (Laravel) ==="
cd "$APP_DIR"
php artisan queue:monitor redis || echo "Nenhum job na fila (normal)"
echo ""

# ================================================
# RESUMO FINAL
# ================================================

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}✓ Configuração concluída com sucesso!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""

echo "Status dos serviços:"
echo "  - Redis: $(systemctl is-active redis-server)"
echo "  - Supervisor: $(systemctl is-active supervisor)"
echo "  - Workers: $(supervisorctl status fluxdesk-worker:* | wc -l) processos"
echo ""

echo "Próximos passos:"
echo "  1. Verificar se workers estão processando: supervisorctl status"
echo "  2. Ver logs dos workers: tail -f $APP_DIR/storage/logs/worker.log"
echo "  3. Testar fila: php artisan tinker → dispatch(new \App\Jobs\TestJob())"
echo ""

echo "Para monitorar:"
echo "  - Redis: redis-cli monitor"
echo "  - Workers: supervisorctl tail -f fluxdesk-worker:fluxdesk-worker_00 stdout"
echo "  - Laravel: tail -f $APP_DIR/storage/logs/laravel.log"
echo ""

