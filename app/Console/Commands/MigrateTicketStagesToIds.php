<?php

namespace App\Console\Commands;

use App\Models\ServiceStage;
use App\Models\Ticket;
use Illuminate\Console\Command;

class MigrateTicketStagesToIds extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tickets:migrate-stages-to-ids';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migra campo stage de nome para ID em tickets antigos';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Migrando tickets com stage armazenado como nome...');

        $tickets = Ticket::all();
        $migrated = 0;
        $skipped = 0;
        $errors = 0;

        foreach ($tickets as $ticket) {
            // Se já é numérico, pular
            if (is_numeric($ticket->stage)) {
                $skipped++;
                continue;
            }

            // Buscar o ID do estágio pelo nome (case-insensitive)
            $stage = ServiceStage::where('tenant_id', $ticket->tenant_id)
                ->where('service_id', $ticket->service_id)
                ->whereRaw('LOWER(name) = ?', [strtolower($ticket->stage)])
                ->first();

            if ($stage) {
                $this->line("  Ticket #{$ticket->id}: '{$ticket->stage}' → ID {$stage->id} ('{$stage->name}')");
                $ticket->stage = $stage->id;
                $ticket->save();
                $migrated++;
            } else {
                $this->error("  ❌ Ticket #{$ticket->id}: Estágio '{$ticket->stage}' não encontrado!");
                $errors++;
            }
        }

        $this->info("\n✅ Migração concluída!");
        $this->info("  Migrados: {$migrated}");
        $this->info("  Pulados (já numéricos): {$skipped}");
        $this->info("  Erros: {$errors}");

        return Command::SUCCESS;
    }
}
