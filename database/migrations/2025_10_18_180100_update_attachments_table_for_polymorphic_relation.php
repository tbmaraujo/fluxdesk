<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Adicionar as novas colunas primeiro
        Schema::table('attachments', function (Blueprint $table) {
            $table->nullableMorphs('attachable');
        });

        // Atualizar os registros existentes para usar o novo relacionamento
        DB::table('attachments')->update([
            'attachable_id' => DB::raw('ticket_id'),
            'attachable_type' => 'App\\Models\\Ticket',
        ]);

        // Remover a coluna ticket_id após a migração dos dados
        Schema::table('attachments', function (Blueprint $table) {
            $table->dropForeign(['ticket_id']);
            $table->dropColumn('ticket_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Adicionar novamente a coluna ticket_id
        Schema::table('attachments', function (Blueprint $table) {
            $table->foreignId('ticket_id')->nullable()->constrained()->onDelete('cascade');
        });

        // Atualizar os registros para voltar ao formato antigo
        DB::table('attachments')
            ->where('attachable_type', 'App\\Models\\Ticket')
            ->update([
                'ticket_id' => DB::raw('attachable_id')
            ]);

        // Remover as colunas do relacionamento polimórfico
        Schema::table('attachments', function (Blueprint $table) {
            $table->dropMorphs('attachable');
        });
    }
};
