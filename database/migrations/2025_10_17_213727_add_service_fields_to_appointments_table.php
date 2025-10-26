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
        Schema::table('appointments', function (Blueprint $table) {
            $table->string('service_type')->nullable();
            $table->string('billing_type')->nullable();
            $table->decimal('travel_cost', 8, 2)->nullable();
            $table->foreignId('contract_id')->nullable()->constrained()->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropForeign(['contract_id']);
            $table->dropColumn(['service_type', 'billing_type', 'travel_cost', 'contract_id']);
        });
    }
};
