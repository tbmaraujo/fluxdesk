<?php

namespace Database\Seeders;

use App\Models\TicketType;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class TicketTypeSeeder extends Seeder
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

        $types = [
            [
                'name' => 'Solicitações',
                'description' => 'Use esta fila para solicitar serviços e informações de TI. Serviços de TI são todas as solicitações de suporte que não envolve um serviço que parou de funcionar. Lembrando que incidente é quando algo parou de funcionar.',
            ],
            [
                'name' => 'Projetos',
                'description' => 'Use esta fila para solicitar o desenvolvimento e ou implantação de um novo projeto para a estrutura de TI',
            ],
            [
                'name' => 'Incidentes',
                'description' => 'Use esta fila apenas para reportar incidentes.',
            ],
        ];

        foreach ($types as $type) {
            TicketType::updateOrCreate(
                [
                    'tenant_id' => $tenantId,
                    'name' => $type['name'],
                ],
                [
                    'tenant_id' => $tenantId,
                    'name' => $type['name'],
                    'description' => $type['description'],
                ]
            );
        }
    }
}
