#!/bin/bash

# Script para aplicar correção do bug do SuperAdmin ver apenas dados de um tenant
# Data: 24/10/2025

echo "=========================================="
echo "🔧 Correção: SuperAdmin Multi-Tenant"
echo "=========================================="
echo ""

# Verificar se está no diretório correto
if [ ! -f "artisan" ]; then
    echo "❌ Erro: Execute este script na raiz do projeto Laravel"
    exit 1
fi

echo "📋 Backup do arquivo original..."
cp app/Http/Middleware/IdentifyTenant.php app/Http/Middleware/IdentifyTenant.php.$(date +%Y%m%d_%H%M%S).bak

if [ $? -eq 0 ]; then
    echo "✅ Backup criado com sucesso"
else
    echo "❌ Erro ao criar backup"
    exit 1
fi

echo ""
echo "🔄 Aplicando correção via git..."
git pull origin main

if [ $? -eq 0 ]; then
    echo "✅ Código atualizado"
else
    echo "❌ Erro ao atualizar código"
    exit 1
fi

echo ""
echo "🧹 Limpando cache..."
php artisan optimize:clear

if [ $? -eq 0 ]; then
    echo "✅ Cache limpo"
else
    echo "⚠️ Aviso: Erro ao limpar cache"
fi

echo ""
echo "=========================================="
echo "✅ Correção aplicada com sucesso!"
echo "=========================================="
echo ""
echo "📝 Próximos passos:"
echo "  1. Fazer logout do sistema"
echo "  2. Fazer login como SuperAdmin"
echo "  3. Acessar 'Novo Ticket'"
echo "  4. Verificar se vê TODOS os clientes"
echo ""
echo "📊 Verificar logs:"
echo "  tail -f storage/logs/laravel.log | grep 'SuperAdmin detectado'"
echo ""
