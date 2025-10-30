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
        Schema::table('replies', function (Blueprint $table) {
            // Verificar coluna por coluna para evitar erro de duplicação
            if (!Schema::hasColumn('replies', 'is_internal')) {
                $table->boolean('is_internal')->default(false)->after('content');
            }
            
            if (!Schema::hasColumn('replies', 'from_email')) {
                $table->string('from_email')->nullable()->after('external_message_id');
            }
            
            if (!Schema::hasColumn('replies', 'from_name')) {
                $table->string('from_name')->nullable()->after('from_email');
            }
            
            if (!Schema::hasColumn('replies', 'via')) {
                $table->enum('via', ['internal', 'email', 'portal'])->default('internal')->after('from_name');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('replies', function (Blueprint $table) {
            $table->dropColumn(['from_email', 'from_name', 'via', 'is_internal']);
        });
    }
};
