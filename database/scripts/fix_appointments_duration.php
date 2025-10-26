<?php

/**
 * Script para recalcular a duração dos apontamentos
 * Execute: php database/scripts/fix_appointments_duration.php
 */

require __DIR__ . '/../../vendor/autoload.php';

$app = require_once __DIR__ . '/../../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Appointment;
use Carbon\Carbon;

echo "Recalculando durações dos apontamentos...\n\n";

$appointments = Appointment::all();
$updated = 0;

foreach ($appointments as $appointment) {
    $startTime = Carbon::parse($appointment->start_time);
    $endTime = Carbon::parse($appointment->end_time);
    $durationInMinutes = $endTime->diffInMinutes($startTime);
    
    if ($appointment->duration_in_minutes != $durationInMinutes) {
        $oldDuration = $appointment->duration_in_minutes;
        $appointment->duration_in_minutes = $durationInMinutes;
        $appointment->save();
        $updated++;
        
        echo "Apontamento #{$appointment->id}: {$oldDuration}m → {$durationInMinutes}m\n";
    }
}

echo "\n✅ Processo concluído!\n";
echo "Total de apontamentos atualizados: {$updated}\n";
