#!/usr/bin/env bash
#
# Teste Local: Migration da tabela replies
# Execute este script localmente antes de fazer deploy
#

set -e

echo "======================================"
echo "🧪 Teste Local - Migration Replies"
echo "======================================"
echo ""

# Verificar estrutura antes
echo "📋 Estrutura ANTES da migration:"
php artisan db:show replies

echo ""
echo "🔄 Executando migration..."
php artisan migrate --path=database/migrations/2025_10_29_174842_add_email_fields_to_replies_table.php

echo ""
echo "📋 Estrutura DEPOIS da migration:"
php artisan db:show replies

echo ""
echo "✅ Teste concluído!"
echo ""
echo "Para reverter (se necessário):"
echo "  php artisan migrate:rollback --step=1"
echo ""

