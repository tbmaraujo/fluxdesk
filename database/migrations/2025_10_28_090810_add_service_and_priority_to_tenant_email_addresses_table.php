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
        Schema::table('tenant_email_addresses', function (Blueprint $table) {
            // Adicionar service_id e priority_id
            $table->foreignId('service_id')->nullable()->after('purpose')->constrained('services')->onDelete('set null');
            $table->foreignId('priority_id')->nullable()->after('service_id')->constrained('priorities')->onDelete('set null');
            
            // Manter a coluna priority antiga temporariamente para compatibilidade
            // mas torná-la nullable
            $table->string('priority_legacy')->nullable()->after('priority_id')->comment('Deprecated - usar priority_id');
        });

        // Migrar dados existentes se houver
        DB::statement('UPDATE tenant_email_addresses SET priority_legacy = priority');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenant_email_addresses', function (Blueprint $table) {
            $table->dropForeign(['service_id']);
            $table->dropForeign(['priority_id']);
            $table->dropColumn(['service_id', 'priority_id', 'priority_legacy']);
        });
    }
};
