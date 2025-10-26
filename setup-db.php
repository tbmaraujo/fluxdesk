<?php

// Arquivo de configuração do banco de dados
$envFile = __DIR__ . '/.env';

if (!file_exists($envFile)) {
    die("Arquivo .env não encontrado!\n");
}

// Ler o conteúdo atual
$envContent = file_get_contents($envFile);

// Configurações para PostgreSQL
$pgConfig = [
    'DB_CONNECTION' => 'pgsql',
    'DB_HOST' => '127.0.0.1',
    'DB_PORT' => '5432',
    'DB_DATABASE' => 'sincro8_tickets',
    'DB_USERNAME' => 'sincro8_user',
    'DB_PASSWORD' => 'sincro8_pass'
];

// Atualizar o arquivo .env
foreach ($pgConfig as $key => $value) {
    // Verificar se a configuração já existe
    if (preg_match("/^{$key}=.*/m", $envContent)) {
        // Substituir a configuração existente
        $envContent = preg_replace("/^{$key}=.*/m", "{$key}={$value}", $envContent);
    } else {
        // Adicionar nova configuração
        $envContent .= "\n{$key}={$value}";
    }
}

// Salvar as alterações
file_put_contents($envFile, $envContent);

echo "Configuração do banco de dados PostgreSQL concluída!\n";
echo "Verifique se as credenciais estão corretas e se o banco de dados 'sincro8_tickets' existe.\n";
