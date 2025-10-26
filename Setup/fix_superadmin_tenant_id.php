<?php

/**
 * Script para Corrigir tenant_id do Super Admin
 * 
 * Super Admins de plataforma devem ter tenant_id = NULL
 * para não ter acesso aos dados operacionais de nenhum tenant.
 * 
 * Execute: php Setup/fix_superadmin_tenant_id.php
 */

require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "🔧 CORRIGINDO tenant_id DOS SUPER ADMINS\n";
echo "=========================================\n\n";

// Buscar Super Admins com tenant_id definido
$superAdmins = \App\Models\User::where('is_super_admin', true)
    ->whereNotNull('tenant_id')
    ->get();

if ($superAdmins->isEmpty()) {
    echo "✅ Todos os Super Admins já estão com tenant_id = NULL\n";
    echo "   Nenhuma correção necessária.\n\n";
    exit(0);
}

echo "⚠️  Encontrados {$superAdmins->count()} Super Admin(s) com tenant_id definido:\n\n";

foreach ($superAdmins as $admin) {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    echo "ID: {$admin->id}\n";
    echo "Nome: {$admin->name}\n";
    echo "Email: {$admin->email}\n";
    echo "Tenant ID atual: {$admin->tenant_id}\n";
    echo "is_super_admin: " . ($admin->is_super_admin ? 'true' : 'false') . "\n";
    echo "\n";
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

// Perguntar confirmação
echo "⚠️  ATENÇÃO:\n";
echo "   - Super Admins com tenant_id podem acessar dados operacionais\n";
echo "   - Para isolamento correto, tenant_id deve ser NULL\n";
echo "   - Isto removerá o vínculo do Super Admin com qualquer tenant\n";
echo "\n";

echo "Deseja corrigir agora? (s/N): ";
$handle = fopen ("php://stdin","r");
$line = fgets($handle);
$resposta = trim($line);

if (strtolower($resposta) !== 's') {
    echo "\n❌ Correção cancelada pelo usuário.\n";
    exit(0);
}

echo "\n🔄 Corrigindo...\n\n";

$corrigidos = 0;

foreach ($superAdmins as $admin) {
    $oldTenantId = $admin->tenant_id;
    
    // Atualizar tenant_id para NULL
    $admin->tenant_id = null;
    $admin->save();
    
    echo "✅ Corrigido: {$admin->name} (tenant_id: {$oldTenantId} → NULL)\n";
    $corrigidos++;
}

echo "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "✅ Correção concluída!\n";
echo "   Total corrigido: $corrigidos Super Admin(s)\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

echo "📋 Próximos passos:\n";
echo "  1. Faça logout do Super Admin\n";
echo "  2. Limpe o cache: php artisan cache:clear\n";
echo "  3. Faça login novamente\n";
echo "  4. Tente acessar /clients - deve ser bloqueado\n";
echo "  5. Verifique os logs: tail -f storage/logs/laravel.log\n";
echo "\n";
