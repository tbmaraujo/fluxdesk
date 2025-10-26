<?php

/**
 * Script de Diagnóstico do Super Admin
 * 
 * Execute: php Setup/diagnose_superadmin.php
 */

require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "🔍 DIAGNÓSTICO DO SISTEMA SUPER ADMIN\n";
echo "=====================================\n\n";

// 1. Verificar usuários com is_super_admin = true
echo "1️⃣  Usuários marcados como Super Admin:\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";

$superAdmins = \App\Models\User::where('is_super_admin', true)->get();

if ($superAdmins->isEmpty()) {
    echo "❌ NENHUM Super Admin encontrado no banco!\n";
} else {
    foreach ($superAdmins as $admin) {
        echo "ID: {$admin->id}\n";
        echo "Nome: {$admin->name}\n";
        echo "Email: {$admin->email}\n";
        echo "Tenant ID: " . ($admin->tenant_id ?? 'NULL') . "\n";
        echo "is_super_admin: " . ($admin->is_super_admin ? 'true' : 'false') . "\n";
        echo "isSuperAdmin(): " . ($admin->isSuperAdmin() ? 'true' : 'false') . "\n";
        echo "Ativo: " . ($admin->is_active ? 'Sim' : 'Não') . "\n";
        echo "───────────────────────────────────\n";
    }
}

echo "\n";

// 2. Verificar middleware registrado
echo "2️⃣  Middleware 'prevent.superadmin' registrado:\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";

$middlewareAliases = \Illuminate\Support\Facades\Route::getMiddleware();

if (isset($middlewareAliases['prevent.superadmin'])) {
    echo "✅ Middleware registrado: {$middlewareAliases['prevent.superadmin']}\n";
} else {
    echo "❌ Middleware NÃO registrado!\n";
}

echo "\n";

// 3. Verificar rota de clientes
echo "3️⃣  Proteção da rota /clients:\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";

$routes = \Illuminate\Support\Facades\Route::getRoutes();
$clientsRoute = $routes->getByName('clients.index');

if ($clientsRoute) {
    $middleware = $clientsRoute->middleware();
    echo "Rota: {$clientsRoute->uri()}\n";
    echo "Middlewares aplicados:\n";
    foreach ($middleware as $m) {
        $icon = str_contains($m, 'prevent.superadmin') ? '✅' : '  ';
        echo "$icon - $m\n";
    }
    
    if (in_array('prevent.superadmin', $middleware)) {
        echo "\n✅ Rota PROTEGIDA corretamente\n";
    } else {
        echo "\n❌ Rota NÃO protegida com prevent.superadmin!\n";
    }
} else {
    echo "❌ Rota 'clients.index' não encontrada!\n";
}

echo "\n";

// 4. Verificar tenant_id dos usuários
echo "4️⃣  Usuários sem tenant_id (problemático):\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";

$usersWithoutTenant = \App\Models\User::whereNull('tenant_id')
    ->where('is_super_admin', false)
    ->get();

if ($usersWithoutTenant->isEmpty()) {
    echo "✅ Todos os usuários normais têm tenant_id\n";
} else {
    echo "⚠️  {$usersWithoutTenant->count()} usuários sem tenant_id:\n";
    foreach ($usersWithoutTenant as $user) {
        echo "  - ID {$user->id}: {$user->name} ({$user->email})\n";
    }
}

echo "\n";

// 5. Verificar clientes sem tenant_id
echo "5️⃣  Clientes sem tenant_id (causa dados misturados):\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";

$clientsWithoutTenant = \App\Models\Client::whereNull('tenant_id')->count();
$totalClients = \App\Models\Client::count();

echo "Total de clientes: $totalClients\n";
echo "Clientes sem tenant_id: $clientsWithoutTenant\n";

if ($clientsWithoutTenant > 0) {
    echo "❌ PROBLEMA: Há clientes sem tenant_id!\n";
    echo "   Estes clientes aparecem para todos os tenants.\n";
    
    $clientsSample = \App\Models\Client::whereNull('tenant_id')->limit(5)->get();
    echo "\n   Exemplos:\n";
    foreach ($clientsSample as $client) {
        echo "   - ID {$client->id}: {$client->name}\n";
    }
} else {
    echo "✅ Todos os clientes têm tenant_id correto\n";
}

echo "\n";

// 6. Distribuição de clientes por tenant
echo "6️⃣  Distribuição de clientes por tenant:\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";

$clientsByTenant = \App\Models\Client::selectRaw('tenant_id, COUNT(*) as total')
    ->groupBy('tenant_id')
    ->orderBy('tenant_id')
    ->get();

foreach ($clientsByTenant as $stat) {
    $tenantName = $stat->tenant_id 
        ? \App\Models\Tenant::find($stat->tenant_id)->name 
        : 'SEM TENANT';
    echo "Tenant {$stat->tenant_id} ({$tenantName}): {$stat->total} clientes\n";
}

echo "\n";

// 7. Recomendações
echo "7️⃣  Recomendações:\n";
echo "━━━━━━━━━━━━━━━━━━━━━\n";

$issues = [];

if ($superAdmins->isEmpty()) {
    $issues[] = "❌ Criar um usuário Super Admin";
}

if (!isset($middlewareAliases['prevent.superadmin'])) {
    $issues[] = "❌ Registrar middleware prevent.superadmin";
}

if ($clientsWithoutTenant > 0) {
    $issues[] = "❌ Corrigir clientes sem tenant_id (CRÍTICO!)";
}

if ($usersWithoutTenant->isNotEmpty()) {
    $issues[] = "⚠️  Verificar usuários sem tenant_id";
}

if (empty($issues)) {
    echo "✅ Sistema configurado corretamente!\n";
} else {
    echo "Problemas encontrados:\n\n";
    foreach ($issues as $issue) {
        echo "  $issue\n";
    }
}

echo "\n";
echo "════════════════════════════════════════════════\n";
echo "✅ Diagnóstico concluído!\n";
echo "════════════════════════════════════════════════\n";
