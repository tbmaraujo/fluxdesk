#!/bin/bash

# Script para limpar configurações antigas do Supervisor
# Execute: sudo bash CLEANUP-OLD-SUPERVISOR.sh

set -e

echo "================================================"
echo "Limpeza de Configurações Antigas do Supervisor"
echo "================================================"
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Parando Supervisor...${NC}"
systemctl stop supervisor 2>/dev/null || true
killall supervisord 2>/dev/null || true
sleep 2

echo -e "${YELLOW}Removendo configurações antigas...${NC}"
echo ""

# Listar configs antigas
echo "Configurações encontradas:"
ls -la /etc/supervisor/conf.d/*.conf 2>/dev/null || echo "Nenhuma configuração encontrada"
echo ""

# Remover configs antigas
rm -fv /etc/supervisor/conf.d/sincro8-worker.conf
rm -fv /etc/supervisor/conf.d/laravel-worker.conf

# Manter apenas fluxdesk-worker.conf (se existir, será recriado)
echo ""
echo -e "${YELLOW}Limpando sockets e pid files...${NC}"
rm -fv /var/run/supervisor.sock
rm -fv /var/run/supervisord.pid
rm -fv /tmp/supervisor.sock

echo ""
echo -e "${GREEN}✓ Limpeza concluída!${NC}"
echo ""
echo "Próximo passo:"
echo "  sudo bash Setup/FIX-SUPERVISOR-ONLY.sh"
echo ""

