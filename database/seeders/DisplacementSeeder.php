<?php

namespace Database\Seeders;

use App\Models\Displacement;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DisplacementSeeder extends Seeder
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
            ['name' => 'Cortesia', 'cost' => 0.00],
            ['name' => 'Padrão (São Gonçalo)', 'cost' => 50.00],
            ['name' => 'Niterói', 'cost' => 75.00],
            ['name' => 'Rio de Janeiro (Capital)', 'cost' => 120.00],
        ];

        foreach ($types as $type) {
            Displacement::updateOrCreate(
                [
                    'tenant_id' => $tenantId,
                    'name' => $type['name'],
                ],
                [
                    'tenant_id' => $tenantId,
                    'name' => $type['name'],
                    'cost' => $type['cost'],
                    'is_active' => true,
                ]
            );
        }
    }
}
