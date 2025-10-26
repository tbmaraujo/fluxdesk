<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tabelas que receberão a coluna tenant_id
     * 
     * @var array
     */
    protected $tables = [
        'users',
        'clients',
        'tickets',
        'replies',
        'appointments',
        'contracts',
        'services',
        'displacements',
        'attachments',
    ];

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Primeiro, garantir que a tabela tenants existe
        if (!Schema::hasTable('tenants')) {
            throw new \RuntimeException('A tabela "tenants" não existe. Execute a migração de tenants primeiro.');
        }

        // Adicionar a coluna tenant_id a todas as tabelas
        foreach ($this->tables as $tableName) {
            if (Schema::hasTable($tableName) && !Schema::hasColumn($tableName, 'tenant_id')) {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->foreignId('tenant_id')
                        ->nullable()
                        ->after('id')
                        ->constrained('tenants')
                        ->onDelete('cascade');
                });
            }
        }

        // Criar um tenant padrão se não existir
        $this->createDefaultTenant();

        // Atualizar os registros existentes para usar o tenant padrão
        $this->updateExistingRecords();
    }

    /**
     * Cria um tenant padrão se não existir nenhum
     */
    protected function createDefaultTenant()
    {
        // Usar DB facade diretamente para evitar problemas com os modelos
        if (DB::table('tenants')->count() === 0) {
            $now = now();
            
            DB::table('tenants')->insert([
                'name' => 'Sincro8',
                'slug' => 'sincro8',
                'domain' => config('app.url'),
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    /**
     * Atualiza os registros existentes para usar o tenant padrão
     */
    protected function updateExistingRecords()
    {
        $defaultTenant = DB::table('tenants')->first();
        
        if (!$defaultTenant) {
            return;
        }

        // Atualizar todas as tabelas para usar o tenant padrão
        foreach ($this->tables as $tableName) {
            if (Schema::hasTable($tableName)) {
                DB::table($tableName)
                    ->whereNull('tenant_id')
                    ->update(['tenant_id' => $defaultTenant->id]);
            }
        }

        // Tornar a coluna tenant_id obrigatória após a migração
        foreach ($this->tables as $tableName) {
            if (Schema::hasTable($tableName) && Schema::hasColumn($tableName, 'tenant_id')) {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->foreignId('tenant_id')
                        ->nullable(false)
                        ->change();
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remover as chaves estrangeiras e colunas
        foreach ($this->tables as $tableName) {
            if (Schema::hasTable($tableName) && Schema::hasColumn($tableName, 'tenant_id')) {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->dropConstrainedForeignId('tenant_id');
                });
            }
        }
    }
};
