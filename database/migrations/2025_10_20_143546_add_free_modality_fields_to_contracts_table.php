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
            // Campos específicos da modalidade "Livre (Ilimitado)"
            $table->text('scope_included')->nullable()->after('extra_hour_value');
            $table->text('scope_excluded')->nullable()->after('scope_included');
            $table->text('fair_use_policy')->nullable()->after('scope_excluded');
            $table->integer('visit_limit')->nullable()->after('fair_use_policy');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('contracts', function (Blueprint $table) {
            $table->dropColumn(['scope_included', 'scope_excluded', 'fair_use_policy', 'visit_limit']);
        });
    }
};
