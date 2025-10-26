<?php

namespace App\Services;

use App\Models\Priority;
use App\Models\ServiceExpedient;
use App\Models\ServiceStage;
use App\Models\Ticket;
use Carbon\Carbon;

class SLACalculatorService
{
    /**
     * Calcula os SLAs para um ticket.
     *
     * @param Ticket $ticket
     * @return array
     */
    public function calculateSLAs(Ticket $ticket): array
    {
        // Buscar a prioridade do ticket
        $priority = Priority::where('tenant_id', $ticket->tenant_id)
            ->where('service_id', $ticket->service_id)
            ->where('name', $ticket->priority)
            ->first();

        // Buscar o estágio do ticket
        // Suportar tanto ID numérico quanto nome (para compatibilidade com tickets antigos)
        $stageQuery = ServiceStage::where('tenant_id', $ticket->tenant_id)
            ->where('service_id', $ticket->service_id);
        
        if (is_numeric($ticket->stage)) {
            $stageQuery->where('id', $ticket->stage);
        } else {
            $stageQuery->where('name', $ticket->stage);
        }
        
        $stage = $stageQuery->first();

        // Buscar expedientes da mesa de serviço
        $expedients = ServiceExpedient::where('tenant_id', $ticket->tenant_id)
            ->where('service_id', $ticket->service_id)
            ->get();

        $ticketCreatedAt = Carbon::parse($ticket->created_at);
        $now = Carbon::now();

        // Calcular tempo total pausado
        $totalPausedMinutes = $this->calculateTotalPausedMinutes($ticket, $now);

        // Calcular SLA de atendimento (response)
        $responseSLA = null;
        if ($priority && $priority->response_sla_time > 0) {
            // Se já houve primeira resposta, calcular se foi cumprido ou violado
            if ($ticket->first_response_at) {
                $firstResponseAt = Carbon::parse($ticket->first_response_at);
                $responseSLA = $this->calculateResponseSLACompleted(
                    $ticketCreatedAt,
                    $firstResponseAt,
                    $priority->response_sla_time,
                    $expedients,
                    $totalPausedMinutes
                );
            } else {
                // Caso contrário, continuar calculando tempo restante
                $responseSLA = $this->calculateSLAStatus(
                    $ticketCreatedAt,
                    $priority->response_sla_time,
                    $expedients,
                    $now,
                    $totalPausedMinutes
                );
            }
        }

        // Calcular SLA de estágio
        $stageSLA = null;
        if ($stage && $stage->sla_time > 0) {
            $stageSLA = $this->calculateSLAStatus(
                $ticketCreatedAt,
                $stage->sla_time,
                $expedients,
                $now,
                $totalPausedMinutes
            );
        }

        // Calcular SLA de solução (resolution)
        $resolutionSLA = null;
        if ($priority && $priority->resolution_sla_time > 0) {
            $resolutionSLA = $this->calculateSLAStatus(
                $ticketCreatedAt,
                $priority->resolution_sla_time,
                $expedients,
                $now,
                $totalPausedMinutes
            );
        }

        return [
            'response_sla' => $responseSLA,
            'stage_sla' => $stageSLA,
            'resolution_sla' => $resolutionSLA,
        ];
    }

    /**
     * Calcula o tempo total que o SLA ficou pausado.
     *
     * @param Ticket $ticket
     * @param Carbon $now
     * @return int
     */
    private function calculateTotalPausedMinutes(Ticket $ticket, Carbon $now): int
    {
        // Total acumulado de pausas anteriores
        $totalPaused = $ticket->sla_total_paused_minutes ?? 0;

        // Se está atualmente pausado, adicionar o tempo desde a pausa atual
        if ($ticket->sla_paused_at) {
            $pausedAt = Carbon::parse($ticket->sla_paused_at);
            $currentPausedMinutes = $pausedAt->diffInMinutes($now);
            $totalPaused += $currentPausedMinutes;
        }

        return $totalPaused;
    }

    /**
     * Calcula o status de um SLA específico.
     *
     * @param Carbon $startDate
     * @param int $slaMinutes
     * @param \Illuminate\Support\Collection $expedients
     * @param Carbon $now
     * @param int $totalPausedMinutes
     * @return array
     */
    private function calculateSLAStatus(
        Carbon $startDate,
        int $slaMinutes,
        $expedients,
        Carbon $now,
        int $totalPausedMinutes = 0
    ): array {
        // Se não há expedientes cadastrados, calcular em horas corridas
        if ($expedients->isEmpty()) {
            $deadline = $startDate->copy()->addMinutes($slaMinutes + $totalPausedMinutes);
            $remainingMinutes = $now->diffInMinutes($deadline, false);

            return [
                'deadline' => $deadline->toIso8601String(),
                'remaining_minutes' => $remainingMinutes,
                'is_breached' => $remainingMinutes < 0,
                'formatted' => $this->formatRemainingTime($remainingMinutes),
            ];
        }

        // Calcular considerando expediente
        $workingMinutesElapsed = $this->calculateWorkingMinutes(
            $startDate,
            $now,
            $expedients
        );

        // Subtrair o tempo pausado do tempo decorrido
        $effectiveWorkingMinutes = $workingMinutesElapsed - $totalPausedMinutes;
        $remainingMinutes = $slaMinutes - $effectiveWorkingMinutes;

        // Calcular data/hora de vencimento considerando o tempo pausado
        $deadline = $this->calculateDeadline($startDate, $slaMinutes + $totalPausedMinutes, $expedients);

        return [
            'deadline' => $deadline ? $deadline->toIso8601String() : null,
            'remaining_minutes' => $remainingMinutes,
            'is_breached' => $remainingMinutes < 0,
            'formatted' => $this->formatRemainingTime($remainingMinutes),
        ];
    }

    /**
     * Calcula quantos minutos úteis (de expediente) passaram entre duas datas.
     *
     * @param Carbon $start
     * @param Carbon $end
     * @param \Illuminate\Support\Collection $expedients
     * @return int
     */
    private function calculateWorkingMinutes(Carbon $start, Carbon $end, $expedients): int
    {
        $totalMinutes = 0;
        $current = $start->copy();

        while ($current->lt($end)) {
            $dayOfWeek = $current->dayOfWeek; // 0 = Domingo, 6 = Sábado

            // Buscar expediente para o dia da semana atual
            $expedient = $expedients->first(function ($exp) use ($dayOfWeek) {
                $days = json_decode($exp->days_of_week, true);
                return is_array($days) && in_array($dayOfWeek, $days);
            });

            if ($expedient) {
                // Tem expediente neste dia
                $startTime = Carbon::parse($current->format('Y-m-d') . ' ' . $expedient->start_time);
                $endTime = Carbon::parse($current->format('Y-m-d') . ' ' . $expedient->end_time);

                // Ajustar início se necessário
                if ($current->lt($startTime)) {
                    $current = $startTime->copy();
                }

                // Se ainda está dentro do dia
                if ($current->lt($endTime)) {
                    // Calcular até o fim do expediente ou até o fim do período
                    $periodEnd = $end->lt($endTime) ? $end : $endTime;
                    $minutesInPeriod = $current->diffInMinutes($periodEnd);
                    $totalMinutes += $minutesInPeriod;
                    $current = $periodEnd->copy();
                }
            }

            // Avançar para o próximo dia (início do expediente)
            if ($current->lt($end)) {
                $current = $current->addDay()->startOfDay();
            }
        }

        return $totalMinutes;
    }

    /**
     * Calcula a data/hora de vencimento do SLA.
     *
     * @param Carbon $start
     * @param int $slaMinutes
     * @param \Illuminate\Support\Collection $expedients
     * @return Carbon|null
     */
    private function calculateDeadline(Carbon $start, int $slaMinutes, $expedients): ?Carbon
    {
        $remainingMinutes = $slaMinutes;
        $current = $start->copy();
        $maxIterations = 365; // Proteção contra loop infinito
        $iterations = 0;

        while ($remainingMinutes > 0 && $iterations < $maxIterations) {
            $iterations++;
            $dayOfWeek = $current->dayOfWeek;

            // Buscar expediente para o dia da semana atual
            $expedient = $expedients->first(function ($exp) use ($dayOfWeek) {
                $days = json_decode($exp->days_of_week, true);
                return is_array($days) && in_array($dayOfWeek, $days);
            });

            if ($expedient) {
                $startTime = Carbon::parse($current->format('Y-m-d') . ' ' . $expedient->start_time);
                $endTime = Carbon::parse($current->format('Y-m-d') . ' ' . $expedient->end_time);

                // Ajustar início se necessário
                if ($current->lt($startTime)) {
                    $current = $startTime->copy();
                }

                if ($current->lt($endTime)) {
                    $availableMinutes = $current->diffInMinutes($endTime);

                    if ($remainingMinutes <= $availableMinutes) {
                        // O deadline é hoje
                        return $current->addMinutes($remainingMinutes);
                    } else {
                        // Consumir todo o expediente de hoje
                        $remainingMinutes -= $availableMinutes;
                    }
                }
            }

            // Avançar para o próximo dia
            $current = $current->addDay()->startOfDay();
        }

        return null; // Não conseguiu calcular (proteção)
    }

    /**
     * Calcula o status final do SLA de resposta quando já foi atendido.
     *
     * @param Carbon $startDate
     * @param Carbon $responseDate
     * @param int $slaMinutes
     * @param \Illuminate\Support\Collection $expedients
     * @param int $totalPausedMinutes
     * @return array
     */
    private function calculateResponseSLACompleted(
        Carbon $startDate,
        Carbon $responseDate,
        int $slaMinutes,
        $expedients,
        int $totalPausedMinutes = 0
    ): array {
        // Calcular quantos minutos úteis se passaram até a resposta
        if ($expedients->isEmpty()) {
            // Sem expediente: calcular em horas corridas
            $minutesElapsed = $startDate->diffInMinutes($responseDate);
        } else {
            // Com expediente: calcular minutos úteis
            $minutesElapsed = $this->calculateWorkingMinutes(
                $startDate,
                $responseDate,
                $expedients
            );
        }

        // Subtrair tempo pausado do tempo decorrido
        $effectiveMinutesElapsed = $minutesElapsed - $totalPausedMinutes;

        $isBreached = $effectiveMinutesElapsed > $slaMinutes;
        $difference = $effectiveMinutesElapsed - $slaMinutes;

        return [
            'deadline' => $responseDate->toIso8601String(),
            'remaining_minutes' => 0, // SLA já foi concluído
            'is_breached' => $isBreached,
            'formatted' => $isBreached 
                ? 'SLA de atendimento violado' 
                : 'Atendido dentro do prazo',
            'response_time_minutes' => $effectiveMinutesElapsed,
        ];
    }

    /**
     * Formata o tempo restante para exibição.
     *
     * @param int $minutes
     * @return string
     */
    private function formatRemainingTime(int $minutes): string
    {
        if ($minutes < 0) {
            $absMinutes = abs($minutes);
            $hours = floor($absMinutes / 60);
            $mins = $absMinutes % 60;

            if ($hours > 24) {
                $days = floor($hours / 24);
                $remainingHours = $hours % 24;
                return "Vencido há {$days}d {$remainingHours}h";
            }

            return "Vencido há {$hours}h {$mins}min";
        }

        if ($minutes === 0) {
            return "Vencendo agora";
        }

        $hours = floor($minutes / 60);
        $mins = $minutes % 60;

        if ($hours > 24) {
            $days = floor($hours / 24);
            $remainingHours = $hours % 24;
            return "Vence em {$days}d {$remainingHours}h";
        }

        return "Vence em {$hours}h {$mins}min";
    }
}
