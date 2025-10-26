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
        Schema::table('clients', function (Blueprint $table) {
            $table->string('trade_name')->nullable()->after('name'); // Nome fantasia
            $table->string('legal_name')->nullable()->after('trade_name'); // Razão social
            $table->string('document')->nullable()->after('legal_name'); // CPF/CNPJ
            $table->string('state_registration')->nullable()->after('document'); // Inscrição estadual
            $table->string('municipal_registration')->nullable()->after('state_registration'); // Inscrição municipal
            $table->string('workplace')->nullable()->after('municipal_registration'); // Ponto de trabalho
            $table->text('notes')->nullable()->after('workplace'); // Anotações
            $table->boolean('visible_to_clients')->default(true)->after('notes'); // Visível para clientes
            $table->boolean('billing_enabled')->default(true)->after('visible_to_clients'); // Faturamento
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->dropColumn([
                'trade_name',
                'legal_name',
                'document',
                'state_registration',
                'municipal_registration',
                'workplace',
                'notes',
                'visible_to_clients',
                'billing_enabled',
            ]);
        });
    }
};
