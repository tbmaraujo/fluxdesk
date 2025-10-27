<?php

namespace App\Console\Commands;

use App\Models\ContractVersion;
use Illuminate\Console\Command;

class UpdateContractVersionsEndDate extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'contracts:update-end-dates';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Atualiza o campo end_date de todas as versões de contrato com base no start_date e expiration_term';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Atualizando end_date das versões de contrato...');

        $versions = ContractVersion::whereNotNull('start_date')
            ->whereNotNull('expiration_term')
            ->get();

        $updated = 0;
        $skipped = 0;

        foreach ($versions as $version) {
            $calculatedEndDate = $version->calculateEndDate();
            
            if ($calculatedEndDate) {
                $version->end_date = $calculatedEndDate->format('Y-m-d');
                $version->save();
                $updated++;
                
                $this->line("✓ Versão {$version->id}: {$version->start_date} + {$version->expiration_term} = {$version->end_date}");
            } else {
                $skipped++;
                $this->line("⊘ Versão {$version->id}: Indeterminado ou inválido");
            }
        }

        $this->newLine();
        $this->info("Concluído! {$updated} versões atualizadas, {$skipped} puladas.");

        return Command::SUCCESS;
    }
}
