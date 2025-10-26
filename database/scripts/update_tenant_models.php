<?php

// Caminho base do projeto
$basePath = __DIR__ . '/../../';

// Lista de modelos para atualizar
$models = [
    'Client',
    'Ticket',
    'Reply',
    'Service',
    'Appointment',
    'Attachment',
    'Contract',
    'Displacement'
];

foreach ($models as $model) {
    $modelPath = $basePath . "app/Models/{$model}.php";
    
    if (!file_exists($modelPath)) {
        echo "Model {$model} not found. Skipping...\n";
        continue;
    }
    
    $content = file_get_contents($modelPath);
    
    // Verificar se o trait já foi adicionado
    if (strpos($content, 'use BelongsToTenant;') !== false) {
        echo "Model {$model} already has BelongsToTenant trait.\n";
        continue;
    }
    
    // Adicionar o use do trait
    $content = str_replace(
        'use HasFactory;',
        "use HasFactory;\n    use \\App\\Models\\Traits\\BelongsToTenant;",
        $content
    );
    
    // Salvar as alterações
    file_put_contents($modelPath, $content);
    echo "Updated {$model} model with BelongsToTenant trait.\n";
}

echo "All models have been processed.\n";
