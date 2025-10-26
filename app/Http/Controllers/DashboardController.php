<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the dashboard.
     *
     * @return Response
     */
    public function index(): Response
    {
        /** @var User $user */
        $user = Auth::user();
        $tenantId = $user->tenant_id;

        // Estatísticas de cabeçalho
        $pendingTickets = Ticket::where('tenant_id', $tenantId)
            ->whereIn('status', ['OPEN', 'IN_PROGRESS'])
            ->count();

        $myTickets = Ticket::where('tenant_id', $tenantId)
            ->where('assignee_id', $user->id)
            ->whereIn('status', ['OPEN', 'IN_PROGRESS'])
            ->count();

        $criticalSlaCount = Ticket::where('tenant_id', $tenantId)
            ->where('priority', 'URGENT')
            ->whereIn('status', ['OPEN', 'IN_PROGRESS'])
            ->count();

        // Cards de estatísticas
        $openTickets = Ticket::where('tenant_id', $tenantId)
            ->where('status', 'OPEN')
            ->count();

        $openTicketsToday = Ticket::where('tenant_id', $tenantId)
            ->where('status', 'OPEN')
            ->whereDate('created_at', today())
            ->count();

        $inProgressTickets = Ticket::where('tenant_id', $tenantId)
            ->where('status', 'IN_PROGRESS')
            ->count();

        $myInProgressTickets = Ticket::where('tenant_id', $tenantId)
            ->where('assignee_id', $user->id)
            ->where('status', 'IN_PROGRESS')
            ->count();

        $resolvedToday = Ticket::where('tenant_id', $tenantId)
            ->where('status', 'CLOSED')
            ->whereDate('updated_at', today())
            ->count();

        $criticalSla = Ticket::where('tenant_id', $tenantId)
            ->where('priority', 'URGENT')
            ->whereIn('status', ['OPEN', 'IN_PROGRESS'])
            ->count();

        // Chamados Prioritários (Críticos e Altos)
        $priorityTickets = Ticket::where('tenant_id', $tenantId)
            ->whereIn('priority', ['URGENT', 'HIGH'])
            ->whereIn('status', ['OPEN', 'IN_PROGRESS'])
            ->with(['client', 'assignee', 'service'])
            ->orderByRaw("CASE WHEN priority = 'URGENT' THEN 1 WHEN priority = 'HIGH' THEN 2 END")
            ->orderBy('created_at', 'asc')
            ->limit(5)
            ->get();

        // Meus Chamados Ativos
        $myActiveTickets = Ticket::where('tenant_id', $tenantId)
            ->where('assignee_id', $user->id)
            ->whereIn('status', ['OPEN', 'IN_PROGRESS'])
            ->with(['client', 'service'])
            ->orderBy('updated_at', 'desc')
            ->limit(5)
            ->get();

        // Atividade Recente
        $recentActivity = $this->getRecentActivity($tenantId);

        return Inertia::render('Dashboard', [
            'stats' => [
                'pending_tickets' => $pendingTickets,
                'my_tickets' => $myTickets,
                'critical_sla' => $criticalSlaCount,
            ],
            'cards' => [
                'open_tickets' => $openTickets,
                'open_tickets_today' => $openTicketsToday,
                'in_progress' => $inProgressTickets,
                'my_in_progress' => $myInProgressTickets,
                'resolved_today' => $resolvedToday,
                'critical_sla' => $criticalSla,
            ],
            'priority_tickets' => $priorityTickets,
            'my_active_tickets' => $myActiveTickets,
            'recent_activity' => $recentActivity,
        ]);
    }

    /**
     * Get recent activity feed.
     *
     * @param int $tenantId
     * @return array
     */
    private function getRecentActivity(int $tenantId): array
    {
        $activities = [];

        // Tickets criados recentemente
        $recentTickets = Ticket::where('tenant_id', $tenantId)
            ->with(['user', 'client'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        foreach ($recentTickets as $ticket) {
            $activities[] = [
                'type' => 'ticket_created',
                'icon' => 'ticket',
                'color' => 'blue',
                'title' => "Novo ticket criado",
                'description' => "Chamado #{$ticket->id} - {$ticket->title}",
                'user' => $ticket->user->name,
                'client' => $ticket->client->name ?? null,
                'time' => $ticket->created_at->diffForHumans(),
                'timestamp' => $ticket->created_at,
            ];
        }

        // Tickets resolvidos recentemente
        $resolvedTickets = Ticket::where('tenant_id', $tenantId)
            ->where('status', 'CLOSED')
            ->with(['assignee', 'client'])
            ->orderBy('updated_at', 'desc')
            ->limit(5)
            ->get();

        foreach ($resolvedTickets as $ticket) {
            $activities[] = [
                'type' => 'ticket_resolved',
                'icon' => 'check',
                'color' => 'green',
                'title' => "Chamado resolvido",
                'description' => "Chamado #{$ticket->id} foi concluído",
                'user' => $ticket->assignee->name ?? 'Sistema',
                'client' => $ticket->client->name ?? null,
                'time' => $ticket->updated_at->diffForHumans(),
                'timestamp' => $ticket->updated_at,
            ];
        }

        // Ordenar por timestamp
        usort($activities, function ($a, $b) {
            return $b['timestamp'] <=> $a['timestamp'];
        });

        // Retornar apenas os 15 mais recentes
        return array_slice($activities, 0, 15);
    }
}
