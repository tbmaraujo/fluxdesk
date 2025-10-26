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
        Schema::table('users', function (Blueprint $table) {
            // Remove client_id da tabela users pois agora users são apenas usuários internos do sistema
            // Contatos de clientes agora estão na tabela contacts
            $table->dropForeign(['client_id']);
            $table->dropColumn('client_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Recriar client_id caso precise fazer rollback
            $table->foreignId('client_id')->nullable()->after('tenant_id')->constrained('clients')->onDelete('set null');
        });
    }
};
