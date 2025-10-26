<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use Database\Seeders\ContractTypeSeeder;
use Database\Seeders\GroupSeeder;
use Database\Seeders\PrioritySeeder;
use Database\Seeders\ServiceSeeder;
use Database\Seeders\TicketTypeSeeder;
use Illuminate\Console\Command;

class PopulateServicesForTenants extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tenants:populate-services';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Popula Tipos de Ticket e Mesas de Serviço para todos os tenants ativos';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Iniciando população de Mesas de Serviço para todos os tenants...');

        $tenants = Tenant::where('is_active', true)->get();

        if ($tenants->isEmpty()) {
            $this->warn('Nenhum tenant ativo encontrado.');
            return Command::SUCCESS;
        }

        $this->info("Encontrados {$tenants->count()} tenant(s) ativo(s).");

        $bar = $this->output->createProgressBar($tenants->count());
        $bar->start();

        foreach ($tenants as $tenant) {
            // Configurar o tenant atual no container
            app()->instance('currentTenant', $tenant);

            $this->newLine();
            $this->info("Processando tenant: {$tenant->name} (ID: {$tenant->id})");

            try {
                // Executar TicketTypeSeeder
                $this->line('  → Criando Tipos de Ticket...');
                (new TicketTypeSeeder())->run();

                // Executar ServiceSeeder
                $this->line('  → Criando Mesas de Serviço...');
                (new ServiceSeeder())->run();

                // Executar PrioritySeeder
                $this->line('  → Criando Prioridades padrão...');
                (new PrioritySeeder())->run();

                // Executar GroupSeeder
                $this->line('  → Criando Grupos de atendentes...');
                (new GroupSeeder())->run();

                // Executar ContractTypeSeeder
                $this->line('  → Criando Tipos de Contrato padrão...');
                (new ContractTypeSeeder())->run();

                $this->info("  ✓ Tenant {$tenant->name} processado com sucesso!");
            } catch (\Exception $e) {
                $this->error("  ✗ Erro ao processar tenant {$tenant->name}: {$e->getMessage()}");
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);
        $this->info('✓ Processo concluído com sucesso!');

        return Command::SUCCESS;
    }
}
