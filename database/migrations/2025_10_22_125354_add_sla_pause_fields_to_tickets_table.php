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
        Schema::table('tickets', function (Blueprint $table) {
            $table->timestamp('sla_paused_at')->nullable()->after('first_response_at');
            $table->string('sla_pause_reason')->nullable()->after('sla_paused_at');
            $table->integer('sla_total_paused_minutes')->default(0)->after('sla_pause_reason');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropColumn(['sla_paused_at', 'sla_pause_reason', 'sla_total_paused_minutes']);
        });
    }
};
