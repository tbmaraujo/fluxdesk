<?php

namespace App\Http\Controllers;

use App\Models\Contract;
use App\Models\Ticket;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ReportController extends Controller
{
    /**
     * Display the reports index page.
     *
     * @return \Inertia\Response
     */
    public function index()
    {
        $tenantId = Auth::user()->tenant_id;

        // Estatísticas gerais para os cards
        $stats = [
            'total_tickets' => Ticket::where('tenant_id', $tenantId)->count(),
            'open_tickets' => Ticket::where('tenant_id', $tenantId)
                ->whereIn('status', ['OPEN', 'IN_PROGRESS', 'PENDING'])
                ->count(),
            'closed_tickets' => Ticket::where('tenant_id', $tenantId)
                ->where('status', 'CLOSED')
                ->count(),
            'active_contracts' => Contract::where('tenant_id', $tenantId)
                ->where('status', 'active')
                ->count(),
        ];

        return Inertia::render('Reports/Index', [
            'stats' => $stats,
        ]);
    }
}

