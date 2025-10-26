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
        Schema::table('contracts', function (Blueprint $table) {
            // Remover campos de Status e Vigência (movidos para contract_versions)
            $table->dropColumn([
                'start_date',
                'renewal_date',
                'expiration_term',
                'auto_renewal',
                'status',
            ]);

            // Remover campos de Condições Financeiras (movidos para contract_versions)
            $table->dropColumn([
                'monthly_value',
                'payment_day',
                'discount',
                'billing_cycle',
                'closing_cycle',
                'payment_method',
                'billing_type',
                'contract_term',
            ]);

            // Remover campos da modalidade "Horas"
            $table->dropColumn([
                'included_hours',
                'extra_hour_value',
            ]);

            // Remover campos da modalidade "Livre (Ilimitado)"
            $table->dropColumn([
                'scope_included',
                'scope_excluded',
                'fair_use_policy',
                'visit_limit',
            ]);

            // Remover campos da modalidade "Por Atendimento"
            $table->dropColumn([
                'included_tickets',
                'extra_ticket_value',
            ]);

            // Remover campos da modalidade "Horas Cumulativas" (Rollover)
            $table->dropColumn([
                'rollover_active',
                'rollover_days_window',
                'rollover_hours_limit',
            ]);

            // Remover campos da modalidade "SaaS/Produto"
            $table->dropColumn('appointments_when_pending');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('contracts', function (Blueprint $table) {
            // Restaurar campos de Status e Vigência
            $table->date('start_date')->nullable();
            $table->date('renewal_date')->nullable();
            $table->string('expiration_term')->nullable();
            $table->boolean('auto_renewal')->default(false);
            $table->string('status')->default('Ativo');

            // Restaurar campos de Condições Financeiras
            $table->decimal('monthly_value', 12, 2)->nullable();
            $table->unsignedTinyInteger('payment_day')->nullable();
            $table->unsignedTinyInteger('due_day')->nullable();
            $table->decimal('discount', 12, 2)->nullable();
            $table->string('billing_cycle')->nullable();
            $table->string('closing_cycle')->nullable();
            $table->string('payment_method')->nullable();
            $table->string('billing_type')->nullable();
            $table->string('contract_term')->nullable();

            // Restaurar campos da modalidade "Horas"
            $table->decimal('included_hours', 8, 2)->nullable();
            $table->decimal('extra_hour_value', 10, 2)->nullable();

            // Restaurar campos da modalidade "Livre (Ilimitado)"
            $table->text('scope_included')->nullable();
            $table->text('scope_excluded')->nullable();
            $table->text('fair_use_policy')->nullable();
            $table->integer('visit_limit')->nullable();

            // Restaurar campos da modalidade "Por Atendimento"
            $table->integer('included_tickets')->nullable();
            $table->decimal('extra_ticket_value', 10, 2)->nullable();

            // Restaurar campos da modalidade "Horas Cumulativas" (Rollover)
            $table->boolean('rollover_active')->default(false);
            $table->integer('rollover_days_window')->nullable();
            $table->integer('rollover_hours_limit')->nullable();

            // Restaurar campos da modalidade "SaaS/Produto"
            $table->boolean('appointments_when_pending')->default(false);
        });
    }
};
