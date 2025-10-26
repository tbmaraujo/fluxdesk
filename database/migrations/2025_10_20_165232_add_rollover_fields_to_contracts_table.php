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
            // Campos específicos da modalidade "Horas Cumulativas" (Rollover)
            $table->boolean('rollover_active')->default(false)->after('extra_ticket_value');
            $table->integer('rollover_days_window')->nullable()->after('rollover_active');
            $table->integer('rollover_hours_limit')->nullable()->after('rollover_days_window');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('contracts', function (Blueprint $table) {
            $table->dropColumn(['rollover_active', 'rollover_days_window', 'rollover_hours_limit']);
        });
    }
};
