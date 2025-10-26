<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Verificar se a coluna client_id ainda existe em users
        $hasClientId = \Illuminate\Support\Facades\Schema::hasColumn('users', 'client_id');
        
        if (!$hasClientId) {
            // A coluna já foi removida, nada a migrar
            return;
        }

        // Migrar users que têm client_id para a tabela contacts
        $usersWithClients = DB::table('users')
            ->whereNotNull('client_id')
            ->get();

        foreach ($usersWithClients as $user) {
            // Criar contato correspondente
            $contactId = DB::table('contacts')->insertGetId([
                'tenant_id' => $user->tenant_id,
                'client_id' => $user->client_id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone ?? null,
                'job_title' => null,
                'contact_type' => 'Solicitante',
                'portal_access' => false,
                'password' => null,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
            ]);

            // Atualizar tickets onde este user é o solicitante
            DB::table('tickets')
                ->where('user_id', $user->id)
                ->update(['contact_id' => $contactId]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Não há rollback seguro para essa migração de dados
        // Os dados já foram movidos para a tabela contacts
    }
};
