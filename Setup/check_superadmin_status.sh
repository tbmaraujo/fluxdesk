#!/bin/bash

###############################################################################
# Script para Verificar Status do Super Admin
# Verifica se o usuário está corretamente marcado como Super Admin
###############################################################################

echo "🔍 Verificando Status de Super Admin no Banco de Dados"
echo "========================================================"
echo ""

# Perguntar credenciais do banco
echo "Digite a senha do MySQL para o banco 'sincro8_tickets':"

# Query para listar todos os usuários com is_super_admin = true
mysql -u root -p sincro8_tickets -e "
SELECT 
    id,
    name,
    email,
    is_super_admin,
    tenant_id,
    is_active
FROM users
WHERE is_super_admin = 1
ORDER BY id;
" --table

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Verificar se há Super Admins
SUPER_ADMIN_COUNT=$(mysql -u root -p sincro8_tickets -se "SELECT COUNT(*) FROM users WHERE is_super_admin = 1;" 2>/dev/null)

if [ "$SUPER_ADMIN_COUNT" -eq 0 ]; then
    echo "⚠️  ATENÇÃO: Nenhum Super Admin encontrado no banco!"
elif [ "$SUPER_ADMIN_COUNT" -eq 1 ]; then
    echo "✅ 1 Super Admin encontrado no sistema"
else
    echo "⚠️  $SUPER_ADMIN_COUNT Super Admins encontrados (recomendado: 1)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Usuários regulares (is_super_admin = 0):"
echo ""

mysql -u root -p sincro8_tickets -e "
SELECT 
    id,
    name,
    email,
    tenant_id,
    is_active
FROM users
WHERE is_super_admin = 0 OR is_super_admin IS NULL
ORDER BY tenant_id, name
LIMIT 10;
" --table

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Resumo por Tenant:"
echo ""

mysql -u root -p sincro8_tickets -e "
SELECT 
    t.id AS tenant_id,
    t.name AS tenant_name,
    COUNT(u.id) AS total_usuarios,
    SUM(CASE WHEN u.is_super_admin = 1 THEN 1 ELSE 0 END) AS super_admins
FROM tenants t
LEFT JOIN users u ON t.id = u.tenant_id
GROUP BY t.id, t.name
ORDER BY t.id;
" --table

echo ""
