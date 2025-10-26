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
        Schema::create('contract_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contract_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('version')->default('1.0'); // Ex: 1.0, 2.0, 3.1
            $table->boolean('is_active_version')->default(true);
            $table->text('description')->nullable(); // Descrição do adendo

            // Campos de Status e Vigência
            $table->date('start_date')->nullable();
            $table->date('renewal_date')->nullable();
            $table->string('expiration_term')->nullable();
            $table->boolean('auto_renewal')->default(false);
            $table->string('status')->default('Ativo');

            // Campos de Condições Financeiras
            $table->decimal('monthly_value', 12, 2)->nullable();
            $table->unsignedTinyInteger('payment_day')->nullable();
            $table->unsignedTinyInteger('due_day')->nullable();
            $table->decimal('discount', 12, 2)->nullable();
            $table->string('billing_cycle')->nullable();
            $table->string('closing_cycle')->nullable();
            $table->string('payment_method')->nullable();
            $table->string('billing_type')->nullable();
            $table->string('contract_term')->nullable();

            // Campos da modalidade "Horas"
            $table->decimal('included_hours', 8, 2)->nullable();
            $table->decimal('extra_hour_value', 10, 2)->nullable();

            // Campos da modalidade "Livre (Ilimitado)"
            $table->text('scope_included')->nullable();
            $table->text('scope_excluded')->nullable();
            $table->text('fair_use_policy')->nullable();
            $table->integer('visit_limit')->nullable();

            // Campos da modalidade "Por Atendimento"
            $table->integer('included_tickets')->nullable();
            $table->decimal('extra_ticket_value', 10, 2)->nullable();

            // Campos da modalidade "Horas Cumulativas" (Rollover)
            $table->boolean('rollover_active')->default(false);
            $table->integer('rollover_days_window')->nullable();
            $table->integer('rollover_hours_limit')->nullable();

            // Campos da modalidade "SaaS/Produto"
            $table->boolean('appointments_when_pending')->default(false);

            $table->timestamps();

            // Índices para performance
            $table->index(['contract_id', 'is_active_version']);
            $table->index('version');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contract_versions');
    }
};
