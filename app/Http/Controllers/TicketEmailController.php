<?php

namespace App\Http\Controllers;

use App\Models\TicketEmail;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TicketEmailController extends Controller
{
    /**
     * Display a listing of ticket emails (ingested emails).
     */
    public function index(Request $request): Response
    {
        $query = TicketEmail::query()
            ->with(['tenant', 'ticket'])
            ->orderBy('received_at', 'desc');

        // Filtro por status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filtro por tenant (se não for superadmin)
        if (!$request->user()->isSuperAdmin()) {
            $query->where('tenant_id', $request->user()->tenant_id);
        }

        // Busca por email ou subject
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('from', 'like', "%{$search}%")
                  ->orWhere('subject', 'like', "%{$search}%")
                  ->orWhere('message_id', 'like', "%{$search}%");
            });
        }

        $ticketEmails = $query->paginate(15)->withQueryString();

        return Inertia::render('Emails/Index', [
            'ticketEmails' => $ticketEmails,
            'filters' => $request->only(['status', 'search']),
        ]);
    }
}
