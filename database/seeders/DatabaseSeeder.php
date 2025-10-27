<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create admin/technician users
        $tenant = Tenant::query()->firstOrCreate(
            ['slug' => 'sincro8'],
            [
                'name' => 'Sincro8',
                'cnpj' => '00.000.000/0000-00',
                'domain' => 'sincro8.test',
                'data' => [],
                'is_active' => true,
            ],
        );

        app()->instance('currentTenant', $tenant);

        // Create admin/technician users (use updateOrCreate to avoid conflicts)
        User::updateOrCreate(
            ["email" => "admin@sincro8.com"],
            [
                "name" => "Admin User",
                "email" => "admin@sincro8.com",
                "password" => bcrypt("password"),
                "role" => "admin",
                "tenant_id" => $tenant->id,
                "is_super_admin" => true, // Super Admin com acesso à gestão de tenants
            ]
        );

        User::updateOrCreate(
            ["email" => "tecnico@sincro8.com"],
            [
                "name" => "Técnico Suporte",
                "email" => "tecnico@sincro8.com",
                "password" => bcrypt("password"),
                "role" => "technician",
                "tenant_id" => $tenant->id,
                "is_super_admin" => false,
            ]
        );

        // Run ticket types and services seeders
        $this->call(TicketTypeSeeder::class);
        $this->call(ServiceSeeder::class);
        $this->call(PrioritySeeder::class);
        $this->call(GroupSeeder::class);
        $this->call(ReportTypeSeeder::class);

        // Run the Client seeder (creates clients with users)
        $this->call(ClientSeeder::class);

        // Run contract related seeders
        $this->call(ContractTypeSeeder::class);
        $this->call(ContractSeeder::class);

        // Run the Contract and Displacement seeders
        $this->call(DisplacementSeeder::class);
    }
}
