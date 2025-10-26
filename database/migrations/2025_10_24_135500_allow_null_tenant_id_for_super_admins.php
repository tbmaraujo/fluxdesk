<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Permite que tenant_id seja NULL para Super Admins de plataforma.
     * Super Admins não devem ter vínculo com nenhum tenant específico.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Alterar tenant_id para permitir NULL
            $table->foreignId('tenant_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     * 
     * Reverte tenant_id para NOT NULL (comportamento original).
     * ATENÇÃO: Isso pode falhar se houver Super Admins com tenant_id = NULL.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Reverter tenant_id para NOT NULL
            $table->foreignId('tenant_id')->nullable(false)->change();
        });
    }
};
