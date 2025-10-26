<?php

namespace Database\Seeders;

use App\Models\ContractType;
use Illuminate\Database\Seeder;

class ContractTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Obter tenant do contexto atual
        $tenant = app('currentTenant');

        if (!$tenant) {
            \Log::warning('ContractTypeSeeder: Nenhum tenant definido no contexto');
            return;
        }

        $tenantId = $tenant->id;

        $types = [
            [
                'name' => 'Horas',
                'modality' => 'Horas',
                'description' => 'Contrato de suporte técnico contínuo com atendimento remoto e presencial conforme SLA.',
            ],
            [
                'name' => 'Por Atendimento',
                'modality' => 'Por Atendimento',
                'description' => 'Visitas programadas para manutenção preventiva de infraestrutura e equipamentos.',
            ],
            [
                'name' => 'Livre',
                'modality' => 'Livre',
                'description' => 'Contratos sob demanda para serviços pontuais e projetos de curta duração.',
            ],
            [
                'name' => 'Horas Cumulativas',
                'modality' => 'Horas Cumulativas',
                'description' => 'Entrega de projetos sob medida com squad dedicado e gestão completa.',
            ],
            [
                'name' => 'SaaS/Produto',
                'modality' => 'SaaS/Produto',
                'description' => 'Acesso completo à plataforma com suporte prioritário e recursos avançados.',
            ],
        ];

        foreach ($types as $type) {
            ContractType::updateOrCreate(
                [
                    'tenant_id' => $tenantId,
                    'name' => $type['name'],
                ],
                [
                    'tenant_id' => $tenantId,
                    'modality' => $type['modality'],
                    'description' => $type['description'],
                    'is_active' => true,
                ],
            );
        }

        \Log::info("ContractTypeSeeder: 5 tipos de contrato criados para tenant ID: {$tenantId}");
    }
}
