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
            // Remover foreign key existente
            $table->dropForeign(['user_id']);
            
            // Tornar coluna nullable
            $table->foreignId('user_id')->nullable()->change();
            
            // Recriar foreign key permitindo null
            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('replies', function (Blueprint $table) {
            // Remover foreign key
            $table->dropForeign(['user_id']);
            
            // Tornar coluna NOT NULL novamente
            $table->foreignId('user_id')->nullable(false)->change();
            
            // Recriar foreign key original
            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');
        });
    }
};

