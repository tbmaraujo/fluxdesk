<?php

namespace Database\Seeders;

use App\Models\ReportType;
use App\Models\Tenant;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ReportTypeSeeder extends Seeder
{
    /**
     * Run the database seeder.
     */
    public function run(): void
    {
        $tenants = Tenant::all();

        foreach ($tenants as $tenant) {
            ReportType::firstOrCreate(
                [
                    'tenant_id' => $tenant->id,
                    'name' => 'RAT',
                ],
                [
                    'description' => 'Relatório de Atendimento Técnico',
                ]
            );
        }

        $this->command->info('Tipos de relatório criados com sucesso!');
    }
}
