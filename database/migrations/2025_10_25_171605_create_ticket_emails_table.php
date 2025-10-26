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
        Schema::create('ticket_emails', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->nullable()->constrained('tenants')->onDelete('cascade');
            $table->foreignId('ticket_id')->nullable()->constrained('tickets')->onDelete('set null');
            $table->string('message_id')->unique(); // Idempotência
            $table->string('from');
            $table->string('to')->nullable();
            $table->string('subject');
            $table->text('raw')->nullable(); // Conteúdo bruto do email (JSON ou texto)
            $table->string('s3_object_key')->nullable(); // Chave do objeto no S3
            $table->enum('status', ['queued', 'processed', 'failed'])->default('queued');
            $table->text('error_message')->nullable();
            $table->timestamp('received_at');
            $table->timestamps();

            $table->index('tenant_id');
            $table->index('ticket_id');
            $table->index('status');
            $table->index('received_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ticket_emails');
    }
};
