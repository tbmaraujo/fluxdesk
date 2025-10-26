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
            // Campos específicos da modalidade "Horas"
            $table->decimal('included_hours', 8, 2)->nullable()->after('contract_term');
            $table->decimal('extra_hour_value', 10, 2)->nullable()->after('included_hours');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('contracts', function (Blueprint $table) {
            $table->dropColumn(['included_hours', 'extra_hour_value']);
        });
    }
};
