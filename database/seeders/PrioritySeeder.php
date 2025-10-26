<?php

namespace Database\Seeders;

use App\Models\Priority;
use App\Models\Service;
use Illuminate\Database\Seeder;

class PrioritySeeder extends Seeder
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

        // Prioridades para cada mesa de serviço
        $prioritiesByService = [
            'Solicitações' => [
                ['name' => 'Baixa', 'response_sla_time' => 1440, 'resolution_sla_time' => 1440],    // 24h
                ['name' => 'Normal', 'response_sla_time' => 960, 'resolution_sla_time' => 960],     // 16h
                ['name' => 'Alta', 'response_sla_time' => 360, 'resolution_sla_time' => 360],       // 6h
                ['name' => 'Crítica', 'response_sla_time' => 240, 'resolution_sla_time' => 240],    // 4h
            ],
            'Projetos' => [
                ['name' => 'Baixa', 'response_sla_time' => 3000, 'resolution_sla_time' => 3000],    // 50h
                ['name' => 'Alta', 'response_sla_time' => 1200, 'resolution_sla_time' => 1200],     // 20h
            ],
            'Incidentes' => [
                ['name' => 'Crítica', 'response_sla_time' => 120, 'resolution_sla_time' => 120],    // 2h
                ['name' => 'Alta', 'response_sla_time' => 240, 'resolution_sla_time' => 240],       // 4h
                ['name' => 'Normal', 'response_sla_time' => 480, 'resolution_sla_time' => 480],     // 8h
                ['name' => 'Baixa', 'response_sla_time' => 720, 'resolution_sla_time' => 720],      // 12h
            ],
        ];

        foreach ($prioritiesByService as $serviceName => $priorities) {
            // Buscar o serviço pelo nome
            $service = Service::where('tenant_id', $tenantId)
                ->where('name', $serviceName)
                ->first();

            if (!$service) {
                continue;
            }

            // Criar as prioridades para este serviço
            foreach ($priorities as $priority) {
                Priority::updateOrCreate(
                    [
                        'tenant_id' => $tenantId,
                        'service_id' => $service->id,
                        'name' => $priority['name'],
                    ],
                    [
                        'tenant_id' => $tenantId,
                        'service_id' => $service->id,
                        'name' => $priority['name'],
                        'response_sla_time' => $priority['response_sla_time'],
                        'resolution_sla_time' => $priority['resolution_sla_time'],
                    ]
                );
            }
        }
    }
}
