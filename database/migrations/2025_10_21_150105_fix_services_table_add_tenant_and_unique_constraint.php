<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('services', function (Blueprint $table) {
            // Remover a constraint única do campo name (se existir)
            $table->dropUnique(['name']);
            
            // Adicionar tenant_id se não existir
            if (!Schema::hasColumn('services', 'tenant_id')) {
                $table->foreignId('tenant_id')->nullable()->after('id')->constrained()->cascadeOnDelete();
            }
            
            // Criar constraint única composta (tenant_id, name)
            $table->unique(['tenant_id', 'name'], 'services_tenant_name_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('services', function (Blueprint $table) {
            // Remover constraint única composta
            $table->dropUnique('services_tenant_name_unique');
            
            // Remover tenant_id
            if (Schema::hasColumn('services', 'tenant_id')) {
                $table->dropForeign(['tenant_id']);
                $table->dropColumn('tenant_id');
            }
            
            // Recriar constraint única no campo name
            $table->unique('name');
        });
    }
};
