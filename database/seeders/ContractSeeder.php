<?php

namespace Database\Seeders;

use App\Models\Client;
use App\Models\Contract;
use App\Models\ContractType;
use Illuminate\Database\Seeder;

class ContractSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $tenantId = 1;

        $clients = Client::query()
            ->where('tenant_id', $tenantId)
            ->get();

        if ($clients->isEmpty()) {
            return;
        }

        $contractTypes = ContractType::query()
            ->where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        if ($contractTypes->isEmpty()) {
            return;
        }

        $definitions = [
            [
                'name' => 'Contrato ACME - Suporte Mensal',
                'technical_notes' => 'Cobertura 8x5 com SLA de 4 horas para incidentes críticos. Inclui relatórios mensais.',
                // Dados que vão para contract_versions
                'version_data' => [
                    'start_date' => now()->subMonths(18)->toDateString(),
                    'payment_day' => 10,
                    'monthly_value' => 4500,
                    'discount' => 0,
                    'payment_method' => 'Posterior',
                    'billing_cycle' => 'Mensal',
                    'closing_cycle' => 'Mensal',
                    'billing_type' => 'Contrato',
                    'contract_term' => 'Indeterminado',
                    'auto_renewal' => true,
                    'status' => 'Ativo',
                    'renewal_date' => now()->addMonths(6)->toDateString(),
                    'expiration_term' => 'Indeterminado',
                ]
            ],
            [
                'name' => 'Contrato Globex - Manutenção Preventiva',
                'technical_notes' => 'Visitas quinzenais em campo e revisão trimestral de servidores. Inclui treinamento da equipe do cliente.',
                'version_data' => [
                    'start_date' => now()->subMonths(9)->toDateString(),
                    'payment_day' => 5,
                    'monthly_value' => 7200,
                    'discount' => 300,
                    'payment_method' => 'Antecipado',
                    'billing_cycle' => 'Mensal',
                    'closing_cycle' => 'Mensal',
                    'billing_type' => 'Contrato',
                    'contract_term' => '24 meses',
                    'auto_renewal' => true,
                    'status' => 'Ativo',
                    'renewal_date' => now()->addMonths(3)->toDateString(),
                    'expiration_term' => '24 meses',
                ]
            ],
            [
                'name' => 'Contrato Soylent - Serviços Avulsos',
                'technical_notes' => 'Horas avulsas mediante aprovação prévia. Foco em demandas emergenciais de desenvolvimento.',
                'version_data' => [
                    'start_date' => now()->subMonths(3)->toDateString(),
                    'payment_day' => 15,
                    'monthly_value' => 2800,
                    'discount' => 0,
                    'payment_method' => 'Posterior',
                    'billing_cycle' => 'Mensal',
                    'closing_cycle' => 'Mensal',
                    'billing_type' => 'Avulso',
                    'contract_term' => '12 meses',
                    'auto_renewal' => false,
                    'status' => 'Ativo',
                    'renewal_date' => now()->addMonths(9)->toDateString(),
                    'expiration_term' => '12 meses',
                ]
            ],
        ];

        foreach ($definitions as $index => $definition) {
            $client = $clients[$index % $clients->count()];
            $contractType = $contractTypes[$index % $contractTypes->count()];

            $versionData = $definition['version_data'];
            unset($definition['version_data']);

            // Criar contrato básico
            $contract = Contract::updateOrCreate(
                [
                    'tenant_id' => $tenantId,
                    'name' => $definition['name'],
                ],
                array_merge($definition, [
                    'tenant_id' => $tenantId,
                    'client_id' => $client->id,
                    'contract_type_id' => $contractType->id,
                ]),
            );

            // Criar versão do contrato
            \DB::table('contract_versions')->updateOrInsert(
                [
                    'contract_id' => $contract->id,
                    'tenant_id' => $tenantId,
                    'version' => '1.0',
                ],
                array_merge($versionData, [
                    'contract_id' => $contract->id,
                    'tenant_id' => $tenantId,
                    'version' => '1.0',
                    'is_active_version' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ])
            );
        }
    }
}
