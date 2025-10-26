<?php

namespace Database\Seeders;

use App\Models\Service;
use App\Models\ServiceStage;
use Illuminate\Database\Seeder;

class ServiceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create the 3 main service desks (queues)
        // These are the primary queues that can be expanded later with specific technical groups and different SLAs
        $tenantId = app()->bound('currentTenant') ? app('currentTenant')->id : null;

        if ($tenantId === null) {
            return;
        }

        $services = [
            ['name' => 'Solicitações'],
            ['name' => 'Incidentes'],
            ['name' => 'Projetos'],
        ];

        // Estágios padrão que serão criados para cada Mesa de Serviço
        $defaultStages = [
            ['name' => 'Pendente', 'sla_time' => 480],      // 8 horas
            ['name' => 'N1', 'sla_time' => 1440],           // 24 horas
            ['name' => 'N2', 'sla_time' => 2880],           // 48 horas
            ['name' => 'Externo', 'sla_time' => 7200],      // 120 horas (5 dias)
            ['name' => 'Administrativo', 'sla_time' => 1440], // 24 horas
            ['name' => 'Fechado', 'sla_time' => 0],         // Sem SLA
        ];

        foreach ($services as $serviceData) {
            $service = Service::updateOrCreate(
                [
                    'tenant_id' => $tenantId,
                    'name' => $serviceData['name'],
                ],
                [
                    'tenant_id' => $tenantId,
                    'name' => $serviceData['name'],
                ]
            );

            // Criar estágios padrão para esta Mesa de Serviço
            foreach ($defaultStages as $stageData) {
                ServiceStage::updateOrCreate(
                    [
                        'tenant_id' => $tenantId,
                        'service_id' => $service->id,
                        'name' => $stageData['name'],
                    ],
                    [
                        'tenant_id' => $tenantId,
                        'service_id' => $service->id,
                        'name' => $stageData['name'],
                        'sla_time' => $stageData['sla_time'],
                    ]
                );
            }
        }
    }
}
