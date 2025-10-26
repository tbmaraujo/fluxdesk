#!/bin/bash

################################################################################
# FLUXDESK - Script de Backup Automático
# Descrição: Backup do banco PostgreSQL e storage (uploads)
# Uso: bash backup.sh [daily|weekly|monthly]
################################################################################

set -euo pipefail

# ============================
# CONFIGURAÇÕES
# ============================

# Diretórios
APP_DIR="/var/www/fluxdesk"
BACKUP_DIR="/var/backups/fluxdesk"
STORAGE_DIR="${APP_DIR}/shared/storage"

# PostgreSQL (ler do .env)
ENV_FILE="${APP_DIR}/shared/.env"

# Retenção de backups
DAILY_RETENTION=7      # 7 dias
WEEKLY_RETENTION=4     # 4 semanas
MONTHLY_RETENTION=6    # 6 meses

# Timestamp
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_TYPE="${1:-daily}"  # daily, weekly, monthly

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ============================
# FUNÇÕES
# ============================

log() {
    echo -e "${GREEN}✓${NC} $1"
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

err() {
    echo -e "${RED}✗${NC} $1"
    exit 1
}

info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# ============================
# VERIFICAÇÕES
# ============================

# Root check
if [ "$EUID" -ne 0 ]; then
    err "Este script deve ser executado como root (use sudo)"
fi

# Verificar se .env existe
if [ ! -f "$ENV_FILE" ]; then
    err "Arquivo .env não encontrado: $ENV_FILE"
fi

# Ler credenciais do .env
DB_HOST=$(grep DB_HOST= "$ENV_FILE" | cut -d '=' -f 2)
DB_PORT=$(grep DB_PORT= "$ENV_FILE" | cut -d '=' -f 2)
DB_DATABASE=$(grep DB_DATABASE= "$ENV_FILE" | cut -d '=' -f 2)
DB_USERNAME=$(grep DB_USERNAME= "$ENV_FILE" | cut -d '=' -f 2)
DB_PASSWORD=$(grep DB_PASSWORD= "$ENV_FILE" | cut -d '=' -f 2)

# Validar variáveis
if [ -z "$DB_DATABASE" ] || [ -z "$DB_USERNAME" ]; then
    err "Credenciais do banco não configuradas no .env"
fi

# ============================
# CRIAR DIRETÓRIOS DE BACKUP
# ============================

mkdir -p "${BACKUP_DIR}/database/${BACKUP_TYPE}"
mkdir -p "${BACKUP_DIR}/storage/${BACKUP_TYPE}"
mkdir -p "${BACKUP_DIR}/logs"

echo ""
echo "========================================"
echo "  FLUXDESK - Backup ${BACKUP_TYPE^^}"
echo "========================================"
echo ""

# ============================
# BACKUP DO BANCO DE DADOS
# ============================

info "1. Iniciando backup do banco de dados..."

DB_BACKUP_FILE="${BACKUP_DIR}/database/${BACKUP_TYPE}/db_${TIMESTAMP}.sql.gz"

# Exportar senha para pg_dump
export PGPASSWORD="$DB_PASSWORD"

# Fazer dump do banco
if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" "$DB_DATABASE" | gzip > "$DB_BACKUP_FILE"; then
    DB_SIZE=$(du -h "$DB_BACKUP_FILE" | cut -f 1)
    log "Backup do banco concluído: $DB_SIZE"
else
    err "Falha ao fazer backup do banco de dados"
fi

# Limpar variável de senha
unset PGPASSWORD

# ============================
# BACKUP DO STORAGE
# ============================

info "2. Iniciando backup do storage (uploads)..."

STORAGE_BACKUP_FILE="${BACKUP_DIR}/storage/${BACKUP_TYPE}/storage_${TIMESTAMP}.tar.gz"

# Fazer backup apenas de app/ (uploads de usuários)
# Excluir logs e cache temporário
if tar -czf "$STORAGE_BACKUP_FILE" \
    -C "$STORAGE_DIR" \
    --exclude='logs/*' \
    --exclude='framework/cache/*' \
    --exclude='framework/sessions/*' \
    --exclude='framework/views/*' \
    app/; then
    STORAGE_SIZE=$(du -h "$STORAGE_BACKUP_FILE" | cut -f 1)
    log "Backup do storage concluído: $STORAGE_SIZE"
else
    warn "Falha ao fazer backup do storage (pode não existir app/)"
fi

# ============================
# BACKUP DO .ENV (SEGURANÇA)
# ============================

info "3. Backup do arquivo .env..."

ENV_BACKUP_FILE="${BACKUP_DIR}/env_${TIMESTAMP}.enc"

# Criptografar .env (usa senha do próprio DB como chave)
if openssl enc -aes-256-cbc -salt -pbkdf2 \
    -in "$ENV_FILE" \
    -out "$ENV_BACKUP_FILE" \
    -pass pass:"$DB_PASSWORD"; then
    log "Backup do .env concluído (criptografado)"
else
    warn "Falha ao criptografar .env"
fi

# ============================
# LIMPEZA DE BACKUPS ANTIGOS
# ============================

info "4. Limpando backups antigos..."

case "$BACKUP_TYPE" in
    daily)
        RETENTION=$DAILY_RETENTION
        ;;
    weekly)
        RETENTION=$WEEKLY_RETENTION
        ;;
    monthly)
        RETENTION=$MONTHLY_RETENTION
        ;;
    *)
        RETENTION=$DAILY_RETENTION
        ;;
esac

# Limpar backups de banco antigos
DB_COUNT=$(find "${BACKUP_DIR}/database/${BACKUP_TYPE}" -type f -name "*.sql.gz" -mtime +$RETENTION -delete | wc -l)
log "Removidos $DB_COUNT backups de banco antigos (>${RETENTION} dias)"

# Limpar backups de storage antigos
STORAGE_COUNT=$(find "${BACKUP_DIR}/storage/${BACKUP_TYPE}" -type f -name "*.tar.gz" -mtime +$RETENTION -delete | wc -l)
log "Removidos $STORAGE_COUNT backups de storage antigos (>${RETENTION} dias)"

# ============================
# LOG DE BACKUP
# ============================

LOG_FILE="${BACKUP_DIR}/logs/backup_${BACKUP_TYPE}.log"
echo "[$(date)] Backup ${BACKUP_TYPE} concluído: DB=${DB_SIZE}, Storage=${STORAGE_SIZE}" >> "$LOG_FILE"

# ============================
# ESTATÍSTICAS
# ============================

info "5. Estatísticas de backup..."

TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f 1)
DB_FILES=$(find "${BACKUP_DIR}/database" -type f -name "*.sql.gz" | wc -l)
STORAGE_FILES=$(find "${BACKUP_DIR}/storage" -type f -name "*.tar.gz" | wc -l)

echo ""
echo "Tamanho total dos backups: $TOTAL_SIZE"
echo "Backups de banco: $DB_FILES arquivos"
echo "Backups de storage: $STORAGE_FILES arquivos"
echo ""

# ============================
# UPLOAD PARA S3 (OPCIONAL)
# ============================

# Descomentar se quiser enviar para S3
# if command -v aws &> /dev/null; then
#     info "6. Enviando para S3..."
#     
#     S3_BUCKET="s3://fluxdesk-backups"
#     
#     aws s3 cp "$DB_BACKUP_FILE" "${S3_BUCKET}/database/${BACKUP_TYPE}/" --storage-class STANDARD_IA
#     aws s3 cp "$STORAGE_BACKUP_FILE" "${S3_BUCKET}/storage/${BACKUP_TYPE}/" --storage-class STANDARD_IA
#     
#     log "Backups enviados para S3"
# fi

# ============================
# RESUMO
# ============================

echo "========================================"
echo -e "${GREEN}✅ Backup ${BACKUP_TYPE^^} concluído com sucesso!${NC}"
echo "========================================"
echo ""
echo "Arquivos criados:"
echo "  - Banco: $DB_BACKUP_FILE"
echo "  - Storage: $STORAGE_BACKUP_FILE"
echo "  - .env: $ENV_BACKUP_FILE"
echo ""

exit 0

################################################################################
# CONFIGURAÇÃO DE CRON AUTOMÁTICO
################################################################################
#
# Editar crontab: sudo crontab -e
#
# Adicionar linhas:
#
# # Backup diário às 02:00
# 0 2 * * * /bin/bash /home/ubuntu/backup.sh daily >> /var/backups/fluxdesk/logs/cron.log 2>&1
#
# # Backup semanal aos domingos às 03:00
# 0 3 * * 0 /bin/bash /home/ubuntu/backup.sh weekly >> /var/backups/fluxdesk/logs/cron.log 2>&1
#
# # Backup mensal no dia 1 às 04:00
# 0 4 1 * * /bin/bash /home/ubuntu/backup.sh monthly >> /var/backups/fluxdesk/logs/cron.log 2>&1
#
################################################################################
# RESTAURAR BACKUP
################################################################################
#
# 1. BANCO DE DADOS:
#
# # Listar backups disponíveis
# ls -lh /var/backups/fluxdesk/database/daily/
#
# # Descompactar e restaurar
# gunzip < /var/backups/fluxdesk/database/daily/db_2025-10-24_02-00-00.sql.gz | \
#   psql -h localhost -U fluxdesk_user -d fluxdesk
#
# 2. STORAGE:
#
# # Extrair backup
# tar -xzf /var/backups/fluxdesk/storage/daily/storage_2025-10-24_02-00-00.tar.gz \
#   -C /var/www/fluxdesk/shared/storage/
#
# # Ajustar permissões
# chown -R www-data:www-data /var/www/fluxdesk/shared/storage/
#
# 3. .ENV:
#
# # Descriptografar .env
# openssl enc -aes-256-cbc -d -pbkdf2 \
#   -in /var/backups/fluxdesk/env_2025-10-24_02-00-00.enc \
#   -out /var/www/fluxdesk/shared/.env \
#   -pass pass:"SENHA_DO_BANCO"
#
################################################################################
# MONITORAMENTO DE BACKUPS
################################################################################
#
# Verificar se backup rodou hoje:
#
# ls -lh /var/backups/fluxdesk/database/daily/ | grep $(date +%Y-%m-%d)
#
# Se não houver resultado, backup falhou!
#
# Configurar alerta via cron:
#
# 0 12 * * * [ -z "$(ls /var/backups/fluxdesk/database/daily/ | grep $(date +%Y-%m-%d))" ] && \
#   echo "ALERTA: Backup diário não foi executado hoje!" | mail -s "BACKUP FALHOU" admin@empresa.com
#
################################################################################
