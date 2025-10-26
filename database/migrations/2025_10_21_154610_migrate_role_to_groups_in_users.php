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
        // Migrar usuários com role 'Administrador' para o grupo 'Administradores'
        $users = DB::table('users')
            ->whereNotNull('tenant_id')
            ->where('role', 'Administrador')
            ->get();

        foreach ($users as $user) {
            $group = DB::table('groups')
                ->where('tenant_id', $user->tenant_id)
                ->where('name', 'Administradores')
                ->first();

            if ($group) {
                DB::table('group_user')->insertOrIgnore([
                    'group_id' => $group->id,
                    'user_id' => $user->id,
                    'tenant_id' => $user->tenant_id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        // Migrar usuários com role 'Técnico' para o grupo 'Técnico'
        $users = DB::table('users')
            ->whereNotNull('tenant_id')
            ->where('role', 'Técnico')
            ->get();

        foreach ($users as $user) {
            $group = DB::table('groups')
                ->where('tenant_id', $user->tenant_id)
                ->where('name', 'Técnico')
                ->first();

            if ($group) {
                DB::table('group_user')->insertOrIgnore([
                    'group_id' => $group->id,
                    'user_id' => $user->id,
                    'tenant_id' => $user->tenant_id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            //
        });
    }
};
