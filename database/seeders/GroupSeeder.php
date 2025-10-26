<?php

namespace Database\Seeders;

use App\Models\Group;
use Illuminate\Database\Seeder;

class GroupSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $tenantId = app()->bound('currentTenant') ? app('currentTenant')->id : null;

        if ($tenantId === null) {
            return;
        }

        $groups = [
            [
                'name' => 'Administradores',
                'description' => 'Grupo de administradores do sistema com acesso total',
            ],
            [
                'name' => 'Administrativo',
                'description' => 'Grupo administrativo com acesso a funções operacionais',
            ],
            [
                'name' => 'Técnico',
                'description' => 'Grupo técnico responsável pelo atendimento e suporte',
            ],
        ];

        foreach ($groups as $group) {
            Group::updateOrCreate(
                [
                    'tenant_id' => $tenantId,
                    'name' => $group['name'],
                ],
                [
                    'tenant_id' => $tenantId,
                    'name' => $group['name'],
                    'description' => $group['description'],
                ]
            );
        }
    }
}
