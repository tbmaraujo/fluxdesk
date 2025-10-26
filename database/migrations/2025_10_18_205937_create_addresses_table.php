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
        Schema::create('addresses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained()->onDelete('cascade');
            $table->string('zip_code', 10)->nullable(); // CEP
            $table->string('street')->nullable(); // Logradouro
            $table->string('neighborhood')->nullable(); // Bairro
            $table->string('city')->nullable(); // Cidade
            $table->string('state', 2)->nullable(); // Estado (UF)
            $table->string('complement')->nullable(); // Complemento
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('addresses');
    }
};
