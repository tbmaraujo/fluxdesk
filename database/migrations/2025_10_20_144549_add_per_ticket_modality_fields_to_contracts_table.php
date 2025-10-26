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
            // Campos específicos da modalidade "Por Atendimento"
            $table->integer('included_tickets')->nullable()->after('visit_limit');
            $table->decimal('extra_ticket_value', 10, 2)->nullable()->after('included_tickets');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('contracts', function (Blueprint $table) {
            $table->dropColumn(['included_tickets', 'extra_ticket_value']);
        });
    }
};
