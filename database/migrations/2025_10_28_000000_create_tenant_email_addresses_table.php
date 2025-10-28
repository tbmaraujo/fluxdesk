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
        Schema::create('tenant_email_addresses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->onDelete('cascade');
            $table->string('email')->unique();
            $table->enum('purpose', ['incoming', 'outgoing', 'both'])->default('incoming');
            $table->enum('priority', ['high', 'normal', 'low'])->default('normal');
            $table->string('client_filter')->nullable(); // "Todos" ou client_id específico
            $table->boolean('verified')->default(false);
            $table->timestamp('verified_at')->nullable();
            $table->boolean('active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();

            // Índices
            $table->index(['tenant_id', 'email']);
            $table->index(['email', 'active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tenant_email_addresses');
    }
};

