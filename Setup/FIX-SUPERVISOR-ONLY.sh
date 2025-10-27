#!/bin/bash

# Script para corrigir problema do Supervisor
# Execute: sudo bash FIX-SUPERVISOR-ONLY.sh

set -e

echo "================================================"
echo "Correção do Supervisor"
echo "================================================"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# ================================================
# 1. PARAR E LIMPAR SUPERVISOR
# ================================================

echo -e "${YELLOW}[1/7] Parando processos do Supervisor...${NC}"

# Parar supervisor se estiver rodando
systemctl stop supervisor 2>/dev/null || true
killall supervisord 2>/dev/null || true
sleep 2

echo -e "${GREEN}✓ Processos parados${NC}"
echo ""

# ================================================
# 2. LIMPAR ARQUIVOS ANTIGOS
# ================================================

echo -e "${YELLOW}[2/7] Limpando arquivos antigos...${NC}"

# Remover socket e pid antigos
rm -f /var/run/supervisor.sock
rm -f /var/run/supervisord.pid
rm -f /tmp/supervisor.sock

echo -e "${GREEN}✓ Arquivos limpos${NC}"
echo ""

# ================================================
# 3. VERIFICAR INSTALAÇÃO
# ================================================

echo -e "${YELLOW}[3/7] Verificando instalação do Supervisor...${NC}"

if ! command -v supervisord &> /dev/null; then
    echo "Supervisor não encontrado. Reinstalando..."
    apt-get update
    apt-get install --reinstall -y supervisor
else
    echo "Supervisor encontrado: $(which supervisord)"
fi

echo ""

# ================================================
# 4. VERIFICAR/CRIAR DIRETÓRIOS
# ================================================

echo -e "${YELLOW}[4/7] Verificando diretórios necessários...${NC}"

# Criar diretórios necessários
mkdir -p /var/log/supervisor
mkdir -p /var/run/supervisor
mkdir -p /etc/supervisor/conf.d

# Ajustar permissões
chown root:root /var/log/supervisor
chown root:root /var/run/supervisor
chmod 755 /var/log/supervisor
chmod 755 /var/run/supervisor

echo -e "${GREEN}✓ Diretórios verificados${NC}"
echo ""

# ================================================
# 5. CORRIGIR CONFIGURAÇÃO PRINCIPAL
# ================================================

echo -e "${YELLOW}[5/7] Verificando configuração principal...${NC}"

SUPERVISOR_CONF="/etc/supervisor/supervisord.conf"

if [ ! -f "$SUPERVISOR_CONF" ]; then
    echo "Criando configuração padrão..."
    cat > "$SUPERVISOR_CONF" << 'EOF'
[unix_http_server]
file=/var/run/supervisor.sock
chmod=0700

[supervisord]
logfile=/var/log/supervisor/supervisord.log
pidfile=/var/run/supervisord.pid
childlogdir=/var/log/supervisor
nodaemon=false
minfds=1024
minprocs=200

[rpcinterface:supervisor]
supervisor.rpcinterface_factory = supervisor.rpcinterface:make_main_rpcinterface

[supervisorctl]
serverurl=unix:///var/run/supervisor.sock

[include]
files = /etc/supervisor/conf.d/*.conf
EOF
    echo -e "${GREEN}✓ Configuração criada${NC}"
else
    echo "Configuração já existe"
    
    # Verificar se tem as seções necessárias
    if ! grep -q "unix_http_server" "$SUPERVISOR_CONF"; then
        echo "Adicionando seção unix_http_server..."
        sed -i '1i[unix_http_server]\nfile=/var/run/supervisor.sock\nchmod=0700\n' "$SUPERVISOR_CONF"
    fi
fi

echo ""

# ================================================
# 6. LIMPAR CONFIGURAÇÕES ANTIGAS E CRIAR NOVA
# ================================================

echo -e "${YELLOW}[6/7] Criando configuração do worker...${NC}"

# Remover configurações antigas que possam conflitar
echo "Removendo configurações antigas..."
rm -f /etc/supervisor/conf.d/sincro8-worker.conf
rm -f /etc/supervisor/conf.d/laravel-worker.conf
rm -f /etc/supervisor/conf.d/*-worker.conf

# Detectar diretório da aplicação
if [ -d "/var/www/fluxdesk/current" ]; then
    APP_DIR="/var/www/fluxdesk/current"
elif [ -d "/var/www/fluxdesk" ]; then
    APP_DIR="/var/www/fluxdesk"
else
    echo -e "${RED}✗ Erro: Diretório da aplicação não encontrado.${NC}"
    echo "Por favor, ajuste o caminho manualmente."
    APP_DIR="/var/www/fluxdesk/current"
fi

echo "Diretório da aplicação: $APP_DIR"

# Verificar se o diretório realmente existe
if [ ! -d "$APP_DIR" ]; then
    echo -e "${RED}✗ Erro: $APP_DIR não existe!${NC}"
    echo "Diretórios encontrados em /var/www:"
    ls -la /var/www/
    exit 1
fi

# Criar diretório de logs se não existir
mkdir -p "$APP_DIR/storage/logs"
chown -R www-data:www-data "$APP_DIR/storage"

WORKER_CONF="/etc/supervisor/conf.d/fluxdesk-worker.conf"

cat > "$WORKER_CONF" << EOF
[program:fluxdesk-worker]
process_name=%(program_name)s_%(process_num)02d
command=php $APP_DIR/artisan queue:work redis --sleep=3 --tries=3 --max-time=3600 --timeout=60
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=$APP_DIR/storage/logs/worker.log
stdout_logfile_maxbytes=50MB
stdout_logfile_backups=10
stopwaitsecs=3600
startsecs=0
EOF

echo -e "${GREEN}✓ Configuração do worker criada: $WORKER_CONF${NC}"
echo ""

# ================================================
# 7. INICIAR SUPERVISOR
# ================================================

echo -e "${YELLOW}[7/7] Iniciando Supervisor...${NC}"

# Habilitar para boot
systemctl enable supervisor

# Iniciar Supervisor
systemctl start supervisor

# Aguardar inicialização
sleep 3

# Verificar se está rodando
if systemctl is-active --quiet supervisor; then
    echo -e "${GREEN}✓ Supervisor está rodando!${NC}"
else
    echo -e "${RED}✗ Erro: Supervisor não iniciou${NC}"
    echo "Tentando iniciar manualmente..."
    supervisord -c /etc/supervisor/supervisord.conf
    sleep 2
fi

# Recarregar configurações
echo "Recarregando configurações..."
supervisorctl reread || echo "Aviso: reread falhou (pode ser normal na primeira vez)"
supervisorctl update || echo "Aviso: update falhou (pode ser normal na primeira vez)"

# Iniciar workers
echo "Iniciando workers..."
supervisorctl start fluxdesk-worker:* || echo "Aviso: workers podem já estar iniciando"

echo ""

# ================================================
# VERIFICAR STATUS FINAL
# ================================================

echo -e "${YELLOW}Verificando status...${NC}"
echo ""

echo "=== Supervisor Service ==="
systemctl status supervisor --no-pager -l 0 | head -20
echo ""

echo "=== Socket ==="
if [ -S /var/run/supervisor.sock ]; then
    echo -e "${GREEN}✓ Socket existe: /var/run/supervisor.sock${NC}"
    ls -la /var/run/supervisor.sock
else
    echo -e "${RED}✗ Socket não encontrado${NC}"
fi
echo ""

echo "=== Workers Status ==="
sleep 2
supervisorctl status || echo "Aguardando workers iniciarem..."
echo ""

# ================================================
# RESUMO
# ================================================

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}Correção do Supervisor concluída!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""

echo "Comandos úteis:"
echo "  - Ver status: sudo supervisorctl status"
echo "  - Reiniciar workers: sudo supervisorctl restart fluxdesk-worker:*"
echo "  - Ver logs: sudo supervisorctl tail -f fluxdesk-worker:fluxdesk-worker_00"
echo "  - Logs do worker: tail -f $APP_DIR/storage/logs/worker.log"
echo ""

echo "Se os workers não apareceram, aguarde alguns segundos e execute:"
echo "  sudo supervisorctl status"
echo ""

