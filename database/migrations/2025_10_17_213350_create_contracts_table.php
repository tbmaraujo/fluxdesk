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
        Schema::create('contracts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained()->cascadeOnDelete();
            $table->foreignId('contract_type_id');
            $table->string('name');
            $table->text('technical_notes')->nullable();
            $table->date('start_date')->nullable();
            $table->unsignedTinyInteger('payment_day')->nullable();
            $table->decimal('monthly_value', 12, 2)->nullable();
            $table->decimal('discount', 12, 2)->nullable();
            $table->string('payment_method')->nullable();
            $table->string('billing_cycle')->nullable();
            $table->string('closing_cycle')->nullable();
            $table->string('billing_type')->nullable();
            $table->string('contract_term')->nullable();
            $table->boolean('auto_renewal')->default(false);
            $table->string('status')->default('Ativo');
            $table->date('renewal_date')->nullable();
            $table->string('expiration_term')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contracts');
    }
};
