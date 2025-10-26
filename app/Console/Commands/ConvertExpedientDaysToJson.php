<?php

namespace App\Console\Commands;

use App\Models\ServiceExpedient;
use Illuminate\Console\Command;

class ConvertExpedientDaysToJson extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'expedient:convert-days-to-json';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Converte days_of_week de CSV para JSON nos expedientes';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $dayMap = [
            'DOM' => 0,
            'SEG' => 1,
            'TER' => 2,
            'QUA' => 3,
            'QUI' => 4,
            'SEX' => 5,
            'SAB' => 6,
        ];

        $expedients = ServiceExpedient::all();
        $converted = 0;

        $this->info('Convertendo days_of_week de CSV para JSON...');

        foreach ($expedients as $expedient) {
            // Verificar se já está em JSON
            $decoded = json_decode($expedient->days_of_week, true);
            if (is_array($decoded)) {
                $this->line("  ⏭️  Expedient ID {$expedient->id} já está em JSON, pulando...");
                continue;
            }

            // Converter CSV para array de números
            $daysCSV = explode(',', $expedient->days_of_week);
            $daysArray = [];

            foreach ($daysCSV as $day) {
                $day = trim($day);
                if (isset($dayMap[$day])) {
                    $daysArray[] = $dayMap[$day];
                }
            }

            // Converter para JSON
            $daysJSON = json_encode($daysArray);

            $this->line("  Expedient ID {$expedient->id}:");
            $this->line("    Antes: {$expedient->days_of_week}");
            $this->line("    Depois: {$daysJSON}");

            // Atualizar no banco
            $expedient->days_of_week = $daysJSON;
            $expedient->save();

            $converted++;
        }

        $this->info("✅ Conversão concluída! {$converted} expediente(s) convertido(s).");

        return Command::SUCCESS;
    }
}
