#!/bin/bash
#
# Script de Backup do Banco de Dados - Fluxdesk
# Uso: bash backup-database.sh
#

set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🗄️  Backup do Banco de Dados - Fluxdesk${NC}"
echo "=========================================="
echo ""

# Diretório de backup
BACKUP_DIR="/home/thiago/Projetos/fludesk/backup"
mkdir -p "$BACKUP_DIR"

# Nome do arquivo de backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/fluxdesk_backup_${TIMESTAMP}.sql"
BACKUP_FILE_GZ="${BACKUP_FILE}.gz"

# Obter credenciais do Laravel
echo -e "${YELLOW}📋 Obtendo credenciais do banco...${NC}"

DB_HOST=$(php artisan tinker --execute="echo config('database.connections.pgsql.host');" 2>/dev/null | tail -n 1)
DB_PORT=$(php artisan tinker --execute="echo config('database.connections.pgsql.port');" 2>/dev/null | tail -n 1)
DB_NAME=$(php artisan tinker --execute="echo config('database.connections.pgsql.database');" 2>/dev/null | tail -n 1)
DB_USER=$(php artisan tinker --execute="echo config('database.connections.pgsql.username');" 2>/dev/null | tail -n 1)
DB_PASS=$(php artisan tinker --execute="echo config('database.connections.pgsql.password');" 2>/dev/null | tail -n 1)

echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo ""

# Criar backup
echo -e "${YELLOW}💾 Criando backup...${NC}"

if [ -z "$DB_PASS" ] || [ "$DB_PASS" = "null" ]; then
    # Sem senha - usar autenticação peer/trust
    pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_FILE"
else
    # Com senha
    PGPASSWORD="$DB_PASS" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_FILE"
fi

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backup SQL criado com sucesso!${NC}"
    
    # Comprimir backup
    echo -e "${YELLOW}📦 Comprimindo backup...${NC}"
    gzip "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Backup comprimido!${NC}"
        echo ""
        echo "📁 Arquivo: $BACKUP_FILE_GZ"
        echo "📊 Tamanho: $(du -h "$BACKUP_FILE_GZ" | cut -f1)"
        echo ""
        
        # Listar backups existentes
        echo -e "${YELLOW}📂 Backups existentes:${NC}"
        ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}'
        echo ""
        
        # Contar backups
        TOTAL_BACKUPS=$(ls -1 "$BACKUP_DIR"/*.sql.gz 2>/dev/null | wc -l)
        echo "📊 Total de backups: $TOTAL_BACKUPS"
        echo ""
        
        # Informações de restauração
        echo -e "${YELLOW}ℹ️  Para restaurar este backup:${NC}"
        echo "  gunzip -c $BACKUP_FILE_GZ | psql -h $DB_HOST -U $DB_USER -d $DB_NAME"
        echo ""
        
    else
        echo -e "${RED}❌ Falha ao comprimir backup${NC}"
        echo "📁 Backup não comprimido salvo em: $BACKUP_FILE"
    fi
else
    echo -e "${RED}❌ Falha ao criar backup${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Backup concluído!${NC}"

