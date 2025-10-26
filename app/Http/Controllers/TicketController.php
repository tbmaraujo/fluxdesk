<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTicketRequest;
use App\Models\Client;
use App\Models\Contact;
use App\Models\ReportType;
use App\Models\Service;
use App\Models\Tenant;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Spatie\LaravelPdf\Facades\Pdf;

class TicketController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Inertia\Response
     */
    public function index()
    {
        // Redirecionar para a tela de tickets abertos
        return redirect()->route('tickets.open.index');
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return \Inertia\Response
     */
    public function create()
    {
        $clients = Client::with("contacts")->orderBy("name")->get();
        $services = Service::with('priorities')->orderBy("name")->get();
        $potentialParentTickets = Ticket::select("id", "title")
            ->where("status", "!=", "CLOSED")
            ->get();

        return Inertia::render("Tickets/Create", [
            "clients" => $clients,
            "services" => $services,
            "potentialParentTickets" => $potentialParentTickets,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param \App\Http\Requests\StoreTicketRequest $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store(StoreTicketRequest $request)
    {
        /** @var User $user */
        $user = Auth::user();
        
        \Log::info('=== INICIANDO CRIAÇÃO DE TICKET ===');
        \Log::info('Usuário:', ['id' => $user->id, 'name' => $user->name, 'tenant_id' => $user->tenant_id]);
        \Log::info('Dados recebidos:', $request->all());
        
        // Encontrar o contato selecionado para obter o client_id
        $selectedContact = Contact::find($request->contact_id);
        
        if (!$selectedContact) {
            \Log::error('Contato não encontrado:', ['contact_id' => $request->contact_id]);
            return back()->withErrors(['contact_id' => 'Solicitante não encontrado'])->withInput();
        }
        
        $clientId = $selectedContact->client_id;
        
        \Log::info('Contato encontrado:', [
            'contact_id' => $selectedContact->id,
            'contact_name' => $selectedContact->name,
            'client_id' => $clientId
        ]);
        
        // Verificar se a prioridade existe para o serviço e tenant
        $priorityExists = \App\Models\Priority::where('tenant_id', $user->tenant_id)
            ->where('service_id', $request->service_id)
            ->where('name', $request->priority)
            ->exists();
        
        if (!$priorityExists) {
            \Log::error('Prioridade inválida:', [
                'priority' => $request->priority,
                'service_id' => $request->service_id,
                'tenant_id' => $user->tenant_id
            ]);
        } else {
            \Log::info('Prioridade validada com sucesso');
        }

        try {
            $ticket = $user->tickets()->create([
                "title" => $request->title,
                "description" => $request->description,
                "priority" => $request->priority,
                "service_id" => $request->service_id,
                "parent_id" => $request->parent_id,
                "contact_id" => $request->contact_id,
                "client_id" => $clientId,
                "tenant_id" => $user->tenant_id, // ✅ CRITICAL FIX: Garantir que tenant_id seja sempre definido
            ]);

            \Log::info('✅ Ticket criado com sucesso:', [
                'ticket_id' => $ticket->id,
                'client_id' => $ticket->client_id,
                'tenant_id' => $ticket->tenant_id,
            ]);
        } catch (\Exception $e) {
            \Log::error('❌ Erro ao criar ticket:', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            return back()->withErrors(['error' => 'Erro ao criar ticket: ' . $e->getMessage()])->withInput();
        }

        // Processar uploads de anexos
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $filename = time() . '_' . $file->getClientOriginalName();
                $path = $file->storeAs('attachments', $filename, 'public');
                
                $ticket->attachments()->create([
                    'user_id' => $user->id,
                    'filename' => $filename,
                    'original_name' => $file->getClientOriginalName(),
                    'path' => $path,
                    'size' => $file->getSize(),
                    'mime_type' => $file->getMimeType(),
                ]);
            }
        }

        return redirect()
            ->route("tickets.open.index")
            ->with("success", "Ticket created successfully.");
    }

    /**
     * Display the specified resource.
     *
     * @param string $id
     * @return \Inertia\Response
     */
    public function show(string $id)
    {
        // Carrega as relações essenciais do ticket.
        $ticket = Ticket::with([
            "service.stages",
            "currentStage",
            "parent",
            "children",
            "user" => function ($query) {
                $query->select('id', 'name', 'email', 'phone', 'notes', 'role', 'is_active', 'two_factor_status', 'tenant_id');
            },
            "contact", // Carrega o solicitante (contato do cliente)
            "client", // Carrega o cliente diretamente do ticket
            "assignee",
            "replies.user",
            "replies.attachments",
            "appointments.user",
            "appointments.displacement",
            "appointments.contract",
            "attachments",
        ])->findOrFail($id);

        // Não precisa mais carregar cliente do user, pois agora temos contact->client

        // Buscar deslocamentos ativos, ordenados por nome
        $displacements = \App\Models\Displacement::query()
            ->where("is_active", true)
            ->orderBy("name")
            ->get();

        // Buscar todos os técnicos (usuários com role técnico ou admin)
        $technicians = User::whereIn('role', ['ADMIN', 'TECHNICIAN'])
            ->orderBy('name')
            ->get(['id', 'name', 'email']);

        // Buscar todos os clientes
        $clients = Client::with("contacts")->orderBy("name")->get();

        // Buscar contratos ativos do tenant onde o ticket foi aberto com seus deslocamentos
        $contracts = \App\Models\Contract::where('tenant_id', $ticket->user->tenant_id)
            ->whereHas('activeVersion', function ($query) {
                $query->where('status', 'Ativo');
            })
            ->with('displacements')
            ->orderBy('name')
            ->get(['id', 'name', 'tenant_id']);

        // Check if the user is authorized to view the ticket
        if (
            $ticket->user_id !== Auth::id() &&
            $ticket->assignee_id !== Auth::id()
        ) {
            abort(403, "Unauthorized action.");
        }

        // Calcular SLAs
        $slaCalculator = new \App\Services\SLACalculatorService();
        $slaData = $slaCalculator->calculateSLAs($ticket);

        // Calcular total de horas apontadas
        $totalAppointmentMinutes = $ticket->appointments->sum('duration_in_minutes');

        // Buscar tipos de relatório disponíveis
        $reportTypes = \App\Models\ReportType::where('tenant_id', Auth::user()->tenant_id)
            ->orderBy('name')
            ->get(['id', 'name', 'description']);

        return Inertia::render("Tickets/Show", [
            "ticket" => $ticket,
            "displacements" => $displacements,
            "technicians" => $technicians,
            "clients" => $clients,
            "contracts" => $contracts,
            "slaData" => $slaData,
            "totalAppointmentMinutes" => $totalAppointmentMinutes,
            "reportTypes" => $reportTypes,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param string $id
     * @return \Inertia\Response
     */
    public function edit(string $id)
    {
        $ticket = Ticket::query()->findOrFail($id);

        // Check if the user is authorized to edit the ticket
        if ($ticket->user_id !== Auth::id()) {
            abort(403, "Unauthorized action.");
        }

        $services = Service::all();
        $clients = Client::with("contacts")->orderBy("name")->get();
        $potentialParentTickets = Ticket::select("id", "title")
            ->where("status", "!=", "CLOSED")
            ->where("id", "!=", $id)
            ->get();

        return Inertia::render("Tickets/Edit", [
            "ticket" => $ticket,
            "services" => $services,
            "clients" => $clients,
            "potentialParentTickets" => $potentialParentTickets,
        ]);
    }

    /**
     * Update the specified resource in storage.
     *
     * @param \Illuminate\Http\Request $request
     * @param string $id
     * @return \Illuminate\Http\RedirectResponse
     */
    public function update(Request $request, string $id)
    {
        $ticket = Ticket::query()->findOrFail($id);

        // Check if the user is authorized to update the ticket
        if ($ticket->user_id !== Auth::id() && $ticket->assignee_id !== Auth::id()) {
            abort(403, "Unauthorized action.");
        }

        $validated = $request->validate([
            "title" => "sometimes|required|string|max:255",
            "description" => "sometimes|required|string",
            "service_id" => "sometimes|required|exists:services,id",
            "priority" => "sometimes|required|string|in:LOW,MEDIUM,HIGH,URGENT",
            "stage" => "sometimes|required|string|in:PENDENTE,N1,N2,EXTERNO",
            "status" => "sometimes|required|string|in:OPEN,IN_PROGRESS,RESOLVED,CLOSED",
            "assignee_id" => "nullable|exists:users,id",
            "contact_id" => "sometimes|required|exists:contacts,id",
            "parent_id" => "nullable|exists:tickets,id",
        ]);

        // Se o contact_id foi alterado, atualizar o client_id também
        if (isset($validated['contact_id']) && $ticket->contact_id != $validated['contact_id']) {
            $newContact = Contact::find($validated['contact_id']);
            if ($newContact) {
                $validated['client_id'] = $newContact->client_id;
            }
        }

        // Detectar se o responsável foi alterado
        $assigneeChanged = isset($validated['assignee_id']) && 
                          $ticket->assignee_id != $validated['assignee_id'];

        $ticket->update($validated);

        $message = "Chamado atualizado com sucesso.";
        if ($assigneeChanged) {
            $message = "Responsável alterado com sucesso";
        }

        return back()->with("success", $message);
    }

    /**
     * Group this ticket to another ticket.
     *
     * @param Request $request
     * @param Ticket $ticket
     * @return \Illuminate\Http\RedirectResponse
     */
    public function group(Request $request, Ticket $ticket)
    {
        $validated = $request->validate([
            'grouped_ticket_id' => 'required|exists:tickets,id',
        ]);

        // Verificar se o ticket a ser agrupado está aberto
        $targetTicket = Ticket::findOrFail($validated['grouped_ticket_id']);
        if ($targetTicket->status === 'CLOSED' || $targetTicket->status === 'CANCELED') {
            return back()->with('error', 'Não é possível agrupar a um ticket que está fechado ou cancelado.');
        }

        // Não pode agrupar a si mesmo
        if ($ticket->id === $targetTicket->id) {
            return back()->with('error', 'Não é possível agrupar o ticket a ele mesmo.');
        }

        $ticket->update(['grouped_ticket_id' => $validated['grouped_ticket_id']]);

        return back()->with('success', "Ticket agrupado com sucesso ao ticket #{$targetTicket->id}.");
    }

    /**
     * Duplicate the specified ticket.
     *
     * @param Ticket $ticket
     * @return \Illuminate\Http\RedirectResponse
     */
    public function duplicate(Ticket $ticket)
    {
        // Criar cópia exata do ticket
        $newTicket = $ticket->replicate();
        $newTicket->status = 'OPEN';
        $newTicket->assignee_id = null; // Novo ticket sem responsável
        $newTicket->grouped_ticket_id = null;
        $newTicket->parent_id = null;
        $newTicket->created_at = now();
        $newTicket->updated_at = now();
        $newTicket->save();

        return redirect()
            ->route('tickets.show', $newTicket)
            ->with('success', "Ticket duplicado com sucesso! Novo ticket #{$newTicket->id} criado.");
    }

    /**
     * Assign the current user as the assignee of this ticket.
     *
     * @param Ticket $ticket
     * @return \Illuminate\Http\RedirectResponse
     */
    public function assign(Ticket $ticket)
    {
        // Verificar se já tem responsável
        if ($ticket->assignee_id) {
            return back()->with('error', 'Este ticket já possui um responsável atribuído.');
        }

        $ticket->update(['assignee_id' => Auth::id()]);

        return back()->with('success', 'Você assumiu este ticket com sucesso!');
    }

    /**
     * Start service on a ticket (assign and set stage).
     *
     * @param Request $request
     * @param Ticket $ticket
     * @return \Illuminate\Http\RedirectResponse
     */
    public function startService(Request $request, Ticket $ticket)
    {
        $validated = $request->validate([
            'stage_id' => 'required|exists:service_stages,id',
        ]);

        $updateData = [
            'stage' => $validated['stage_id'],
            'assignee_id' => Auth::id(),
        ];

        // Registrar primeira resposta se ainda não foi registrada
        if (!$ticket->first_response_at) {
            $updateData['first_response_at'] = now();
        }

        $ticket->update($updateData);

        return back()->with('success', 'Atendimento iniciado com sucesso!');
    }

    /**
     * Pause SLA for the specified ticket.
     *
     * @param Request $request
     * @param Ticket $ticket
     * @return \Illuminate\Http\RedirectResponse
     */
    public function pauseSLA(Request $request, Ticket $ticket)
    {
        $validated = $request->validate([
            'reason' => 'required|string|max:255',
        ]);

        if ($ticket->sla_paused_at) {
            return back()->with('error', 'O SLA já está pausado.');
        }

        $ticket->update([
            'sla_paused_at' => now(),
            'sla_pause_reason' => $validated['reason'],
        ]);

        return back()->with('success', 'SLA pausado com sucesso!');
    }

    /**
     * Resume SLA for the specified ticket.
     *
     * @param Ticket $ticket
     * @return \Illuminate\Http\RedirectResponse
     */
    public function resumeSLA(Ticket $ticket)
    {
        if (!$ticket->sla_paused_at) {
            return back()->with('error', 'O SLA não está pausado.');
        }

        // Calcular minutos pausados (arredondar para inteiro)
        $pausedMinutes = (int) now()->diffInMinutes($ticket->sla_paused_at);
        
        $ticket->update([
            'sla_paused_at' => null,
            'sla_pause_reason' => null,
            'sla_total_paused_minutes' => $ticket->sla_total_paused_minutes + $pausedMinutes,
        ]);

        return back()->with('success', 'SLA retomado com sucesso!');
    }

    /**
     * Generate a report for the specified ticket.
     *
     * @param Request $request
     * @param Ticket $ticket
     * @return \Illuminate\Http\Response
     */
    public function generateReport(Request $request, Ticket $ticket)
    {
        $validated = $request->validate([
            'report_type_id' => 'required|exists:report_types,id',
        ]);

        // Buscar o tipo de relatório
        $reportType = ReportType::findOrFail($validated['report_type_id']);
        
        // Verificar se é o relatório RAT
        if ($reportType->name === 'RAT') {
            return $this->generateRATReport($ticket);
        }
        
        // Caso seja outro tipo de relatório no futuro
        return back()->with('error', 'Tipo de relatório não implementado.');
    }
    
    /**
     * Generate RAT (Relatório de Atendimento Técnico) PDF.
     *
     * @param Ticket $ticket
     * @return \Illuminate\Http\Response
     */
    private function generateRATReport(Ticket $ticket)
    {
        // Carregar todos os dados necessários do ticket
        $ticket->load([
            'user',           // Solicitante
            'client',         // Cliente
            'assignee',       // Técnico responsável
            'appointments.user', // Apontamentos com técnicos
        ]);
        
        // Buscar tenant atual
        $tenant = Tenant::find(Auth::user()->tenant_id);
        
        // Calcular total de minutos dos apontamentos
        $totalMinutes = $ticket->appointments->sum('duration_in_minutes');
        
        // Gerar PDF usando Spatie (usa Chromium, suporte total a UTF-8)
        return Pdf::view('reports.rat', [
                'ticket' => $ticket,
                'tenant' => $tenant,
                'totalMinutes' => $totalMinutes,
            ])
            ->format('a4')
            ->name('RAT_Ticket_' . $ticket->id . '_' . now()->format('Y-m-d_His') . '.pdf')
            ->download();
    }

    /**
     * Cancel the specified ticket.
     *
     * @param Ticket $ticket
     * @return \Illuminate\Http\RedirectResponse
     */
    public function cancel(Ticket $ticket)
    {
        // Verificar se tem apontamentos
        $appointmentsCount = $ticket->appointments()->count();
        if ($appointmentsCount > 0) {
            return back()->with('error', "Não é possível cancelar este ticket pois há {$appointmentsCount} apontamento(s) registrado(s).");
        }

        $ticket->update(['status' => 'CANCELED']);

        return back()->with('success', 'Ticket cancelado com sucesso.');
    }

    /**
     * Unassign the current assignee from the ticket (leave ticket).
     *
     * @param Ticket $ticket
     * @return \Illuminate\Http\RedirectResponse
     */
    public function unassign(Ticket $ticket)
    {
        // Verificar se o ticket tem responsável
        if (!$ticket->assignee_id) {
            return back()->with('error', 'Este ticket não possui responsável atribuído.');
        }

        $ticket->update(['assignee_id' => null]);

        return back()->with('success', 'Você deixou este ticket. Ele agora está sem responsável.');
    }

    /**
     * Transfer the ticket to another technician.
     *
     * @param Request $request
     * @param Ticket $ticket
     * @return \Illuminate\Http\RedirectResponse
     */
    public function transfer(Request $request, Ticket $ticket)
    {
        $validated = $request->validate([
            'assignee_id' => 'required|exists:users,id',
        ]);

        // Verificar se está tentando transferir para o mesmo responsável
        if ($ticket->assignee_id == $validated['assignee_id']) {
            return back()->with('error', 'O ticket já está atribuído a este técnico.');
        }

        // Buscar nome do novo responsável para a mensagem
        $newAssignee = \App\Models\User::find($validated['assignee_id']);

        $ticket->update(['assignee_id' => $validated['assignee_id']]);

        return back()->with('success', "Ticket transferido com sucesso para {$newAssignee->name}.");
    }

    /**
     * Finalize the ticket and move it to pending review stage.
     *
     * @param Ticket $ticket
     * @return \Illuminate\Http\RedirectResponse
     */
    public function finalize(Ticket $ticket)
    {
        // Verificar se o ticket tem pelo menos um apontamento
        $appointmentsCount = $ticket->appointments()->count();
        
        if ($appointmentsCount === 0) {
            return back()->with('error', 'Não é possível finalizar um ticket sem apontamentos. Por favor, registre pelo menos um apontamento antes de finalizar.');
        }

        // Atualizar o status para "Em Revisão" e estágio para "Pendente de Revisão"
        $ticket->update([
            'status' => 'IN_REVIEW',
            'stage' => 'PENDING_REVIEW',
        ]);

        return back()->with('success', 'Ticket finalizado com sucesso! Ele agora está em revisão.');
    }

    /**
     * Reopen a closed, canceled or under review ticket (only for administrators).
     *
     * @param Ticket $ticket
     * @return \Illuminate\Http\RedirectResponse
     */
    public function reopen(Ticket $ticket)
    {
        // Verificar se o usuário é administrador
        $user = auth()->user();
        if (!$user->is_super_admin && !$user->groups()->where('name', 'Administradores')->exists()) {
            return back()->with('error', 'Você não tem permissão para reabrir tickets.');
        }

        // Verificar se o ticket está fechado, cancelado ou em revisão
        if (!in_array($ticket->status, ['CLOSED', 'CANCELED', 'IN_REVIEW'])) {
            return back()->with('error', 'Apenas tickets fechados, cancelados ou em revisão podem ser reabertos.');
        }

        // Reabrir o ticket
        $ticket->update([
            'status' => 'OPEN',
            'stage' => 'PENDENTE',
        ]);

        return back()->with('success', 'Ticket reaberto com sucesso!');
    }

    /**
     * Review a ticket in review status (approve or reject).
     *
     * @param Request $request
     * @param Ticket $ticket
     * @return \Illuminate\Http\RedirectResponse
     */
    public function review(Request $request, Ticket $ticket)
    {
        // Verificar se o usuário é administrador
        $user = auth()->user();
        if (!$user->is_super_admin && !$user->groups()->where('name', 'Administradores')->exists()) {
            return back()->with('error', 'Você não tem permissão para revisar tickets.');
        }

        // Verificar se o ticket está em revisão
        if ($ticket->status !== 'IN_REVIEW') {
            return back()->with('error', 'Apenas tickets em revisão podem ser aprovados ou reprovados.');
        }

        $validated = $request->validate([
            'action' => 'required|in:approve,reject',
        ]);

        if ($validated['action'] === 'approve') {
            // Aprovar: Fechar o ticket
            $ticket->update([
                'status' => 'CLOSED',
                'stage' => 'CONCLUIDO',
            ]);

            return back()->with('success', 'Ticket aprovado e fechado com sucesso!');
        } else {
            // Reprovar: Reabrir o ticket (mantém o assignee_id original)
            $ticket->update([
                'status' => 'OPEN',
                'stage' => 'PENDENTE',
            ]);

            return back()->with('success', 'Ticket reprovado e reaberto. O responsável original foi mantido.');
        }
    }

    /**
     * Display open tickets.
     *
     * @return \Inertia\Response
     */
    public function openIndex(Request $request)
    {
        /** @var User $user */
        $user = Auth::user();
        
        \Log::info('=== DEBUG TICKETS ABERTOS ===');
        \Log::info('User ID:', ['user_id' => $user->id]);
        \Log::info('Tenant ID:', ['tenant_id' => $user->tenant_id]);
        \Log::info('Filtros recebidos:', $request->all());
        
        // Verificar quantos tickets existem no total para este tenant
        $totalTickets = Ticket::where('tenant_id', $user->tenant_id)->count();
        \Log::info('Total de tickets no tenant:', ['count' => $totalTickets]);
        
        // Verificar tickets por status
        $ticketsByStatus = Ticket::where('tenant_id', $user->tenant_id)
            ->selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->get();
        \Log::info('Tickets por status:', ['data' => $ticketsByStatus]);
        
        $baseQuery = Ticket::where('tenant_id', $user->tenant_id)
            ->whereIn('status', ['OPEN', 'IN_PROGRESS']);
        
        $query = clone $baseQuery;
        $query->with(['service', 'assignee', 'user', 'client', 'contact']);
        
        // Filtro rápido (críticos, alta, meus tickets)
        if ($request->filled('quick_filter')) {
            switch ($request->quick_filter) {
                case 'critical':
                    $query->where('priority', 'Crítica');
                    break;
                case 'high':
                    $query->where('priority', 'Alta');
                    break;
                case 'my_tickets':
                    $query->where('assignee_id', $user->id);
                    break;
            }
        }
        
        // Busca por termo
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('id', 'like', "%{$search}%");
            });
        }
        
        // Filtro por cliente
        if ($request->filled('client_id') && $request->client_id !== 'all') {
            \Log::info('Filtrando por cliente:', ['client_id' => $request->client_id]);
            $query->where('client_id', $request->client_id);
        }
        
        // Filtro por período
        if ($request->filled('period') && $request->period !== 'all') {
            $days = match($request->period) {
                '7' => 7,
                '15' => 15,
                '30' => 30,
                default => null,
            };
            
            if ($days) {
                $date = now()->subDays($days);
                \Log::info('Filtrando por período:', ['days' => $days, 'date' => $date]);
                $query->where('updated_at', '>=', $date);
            }
        }
        
        // Filtro por data customizada
        if ($request->filled('date_from')) {
            \Log::info('Filtrando por data inicial:', ['date_from' => $request->date_from]);
            $query->whereDate('updated_at', '>=', $request->date_from);
        }
        
        if ($request->filled('date_to')) {
            \Log::info('Filtrando por data final:', ['date_to' => $request->date_to]);
            $query->whereDate('updated_at', '<=', $request->date_to);
        }
        
        // Filtro por responsável
        if ($request->filled('assignee_id') && $request->assignee_id !== 'all') {
            \Log::info('Filtrando por responsável:', ['assignee_id' => $request->assignee_id]);
            $query->where('assignee_id', $request->assignee_id);
        }
        
        // Filtro por solicitante (contact)
        if ($request->filled('contact_id') && $request->contact_id !== 'all') {
            \Log::info('Filtrando por solicitante:', ['contact_id' => $request->contact_id]);
            $query->where('contact_id', $request->contact_id);
        }
        
        // Paginação de 5 itens por página
        $tickets = $query->latest('updated_at')->paginate(5);
        
        \Log::info('Total de tickets encontrados:', ['count' => $tickets->total()]);
        
        // Calcular estatísticas para os cards
        $stats = [
            'total' => (clone $baseQuery)->count(),
            'critical' => (clone $baseQuery)->where('priority', 'Crítica')->count(),
            'high' => (clone $baseQuery)->where('priority', 'Alta')->count(),
            'my_tickets' => (clone $baseQuery)->where('assignee_id', $user->id)->count(),
        ];
        
        // Lista de clientes para o filtro
        $clients = Client::where('tenant_id', $user->tenant_id)
            ->orderBy('name')
            ->get(['id', 'name']);
        
        // Lista de técnicos (responsáveis) para o filtro
        $technicians = User::where('tenant_id', $user->tenant_id)
            ->whereIn('role', ['ADMIN', 'TECHNICIAN'])
            ->orderBy('name')
            ->get(['id', 'name']);
        
        // Lista de contatos (solicitantes) para o filtro
        $contacts = \App\Models\Contact::where('tenant_id', $user->tenant_id)
            ->orderBy('name')
            ->get(['id', 'name']);
        
        return Inertia::render('Tickets/Open', [
            'tickets' => $tickets,
            'stats' => $stats,
            'clients' => $clients,
            'technicians' => $technicians,
            'contacts' => $contacts,
            'filters' => $request->only(['client_id', 'period', 'date_from', 'date_to', 'quick_filter', 'search', 'assignee_id', 'contact_id']),
        ]);
    }

    /**
     * Display tickets under review.
     *
     * @return \Inertia\Response
     */
    public function reviewIndex(Request $request)
    {
        /** @var User $user */
        $user = Auth::user();
        
        \Log::info('Filtros recebidos:', $request->all());
        
        $baseQuery = Ticket::where('tenant_id', $user->tenant_id)
            ->where('status', 'IN_REVIEW');
        
        $query = clone $baseQuery;
        $query->with(['service', 'assignee', 'user', 'client', 'contact']);
        
        // Filtro rápido (críticos, alta, meus tickets)
        if ($request->filled('quick_filter')) {
            switch ($request->quick_filter) {
                case 'critical':
                    $query->where('priority', 'Crítica');
                    break;
                case 'high':
                    $query->where('priority', 'Alta');
                    break;
                case 'my_tickets':
                    $query->where('assignee_id', $user->id);
                    break;
            }
        }
        
        // Busca por termo
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('id', 'like', "%{$search}%");
            });
        }
        
        // Filtro por cliente
        if ($request->filled('client_id') && $request->client_id !== 'all') {
            \Log::info('Filtrando por cliente:', ['client_id' => $request->client_id]);
            $query->where('client_id', $request->client_id);
        }
        
        // Filtro por período
        if ($request->filled('period') && $request->period !== 'all') {
            $days = match($request->period) {
                '7' => 7,
                '15' => 15,
                '30' => 30,
                default => null,
            };
            
            if ($days) {
                $date = now()->subDays($days);
                \Log::info('Filtrando por período:', ['days' => $days, 'date' => $date]);
                $query->where('updated_at', '>=', $date);
            }
        }
        
        // Filtro por data customizada
        if ($request->filled('date_from')) {
            \Log::info('Filtrando por data inicial:', ['date_from' => $request->date_from]);
            $query->whereDate('updated_at', '>=', $request->date_from);
        }
        
        if ($request->filled('date_to')) {
            \Log::info('Filtrando por data final:', ['date_to' => $request->date_to]);
            $query->whereDate('updated_at', '<=', $request->date_to);
        }
        
        // Filtro por responsável
        if ($request->filled('assignee_id') && $request->assignee_id !== 'all') {
            \Log::info('Filtrando por responsável:', ['assignee_id' => $request->assignee_id]);
            $query->where('assignee_id', $request->assignee_id);
        }
        
        // Filtro por solicitante (contact)
        if ($request->filled('contact_id') && $request->contact_id !== 'all') {
            \Log::info('Filtrando por solicitante:', ['contact_id' => $request->contact_id]);
            $query->where('contact_id', $request->contact_id);
        }
        
        // Paginação de 5 itens por página
        $tickets = $query->latest('updated_at')->paginate(5);
        
        \Log::info('Total de tickets encontrados:', ['count' => $tickets->total()]);
        
        // Calcular estatísticas para os cards
        $stats = [
            'total' => (clone $baseQuery)->count(),
            'critical' => (clone $baseQuery)->where('priority', 'Crítica')->count(),
            'high' => (clone $baseQuery)->where('priority', 'Alta')->count(),
            'my_tickets' => (clone $baseQuery)->where('assignee_id', $user->id)->count(),
        ];
        
        // Lista de clientes para o filtro
        $clients = Client::where('tenant_id', $user->tenant_id)
            ->orderBy('name')
            ->get(['id', 'name']);
        
        // Lista de técnicos (responsáveis) para o filtro
        $technicians = User::where('tenant_id', $user->tenant_id)
            ->whereIn('role', ['ADMIN', 'TECHNICIAN'])
            ->orderBy('name')
            ->get(['id', 'name']);
        
        // Lista de contatos (solicitantes) para o filtro
        $contacts = \App\Models\Contact::where('tenant_id', $user->tenant_id)
            ->orderBy('name')
            ->get(['id', 'name']);
        
        return Inertia::render('Tickets/Review', [
            'tickets' => $tickets,
            'stats' => $stats,
            'clients' => $clients,
            'technicians' => $technicians,
            'contacts' => $contacts,
            'filters' => $request->only(['client_id', 'period', 'date_from', 'date_to', 'quick_filter', 'search', 'assignee_id', 'contact_id']),
        ]);
    }

    /**
     * Display pre-tickets (pending triage).
     *
     * @return \Inertia\Response
     */
    public function preTicketsIndex(Request $request)
    {
        /** @var User $user */
        $user = Auth::user();
        
        \Log::info('Filtros recebidos:', $request->all());
        
        $baseQuery = Ticket::where('tenant_id', $user->tenant_id)
            ->where('status', 'PRE_TICKET');
        
        $query = clone $baseQuery;
        $query->with(['service', 'assignee', 'user', 'client', 'contact']);
        
        // Busca por termo
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('id', 'like', "%{$search}%");
            });
        }
        
        // Filtro por cliente
        if ($request->filled('client_id') && $request->client_id !== 'all') {
            \Log::info('Filtrando por cliente:', ['client_id' => $request->client_id]);
            $query->where('client_id', $request->client_id);
        }
        
        // Filtro por período
        if ($request->filled('period') && $request->period !== 'all') {
            $days = match($request->period) {
                '7' => 7,
                '15' => 15,
                '30' => 30,
                default => null,
            };
            
            if ($days) {
                $date = now()->subDays($days);
                \Log::info('Filtrando por período:', ['days' => $days, 'date' => $date]);
                $query->where('updated_at', '>=', $date);
            }
        }
        
        // Filtro por data customizada
        if ($request->filled('date_from')) {
            \Log::info('Filtrando por data inicial:', ['date_from' => $request->date_from]);
            $query->whereDate('updated_at', '>=', $request->date_from);
        }
        
        if ($request->filled('date_to')) {
            \Log::info('Filtrando por data final:', ['date_to' => $request->date_to]);
            $query->whereDate('updated_at', '<=', $request->date_to);
        }
        
        // Filtro por solicitante (contact)
        if ($request->filled('contact_id') && $request->contact_id !== 'all') {
            \Log::info('Filtrando por solicitante:', ['contact_id' => $request->contact_id]);
            $query->where('contact_id', $request->contact_id);
        }
        
        // Paginação de 5 itens por página
        $tickets = $query->latest('created_at')->paginate(5);
        
        \Log::info('Total de pré-tickets encontrados:', ['count' => $tickets->total()]);
        
        // Calcular estatísticas para os cards
        $stats = [
            'total' => (clone $baseQuery)->count(),
            'today' => (clone $baseQuery)->whereDate('created_at', today())->count(),
            'week' => (clone $baseQuery)->where('created_at', '>=', now()->subDays(7))->count(),
            'month' => (clone $baseQuery)->where('created_at', '>=', now()->subDays(30))->count(),
        ];
        
        // Lista de clientes para o filtro
        $clients = Client::where('tenant_id', $user->tenant_id)
            ->orderBy('name')
            ->get(['id', 'name']);
        
        // Lista de contatos (solicitantes) para o filtro
        $contacts = \App\Models\Contact::where('tenant_id', $user->tenant_id)
            ->orderBy('name')
            ->get(['id', 'name']);
        
        return Inertia::render('Tickets/PreTickets', [
            'tickets' => $tickets,
            'stats' => $stats,
            'clients' => $clients,
            'contacts' => $contacts,
            'filters' => $request->only(['client_id', 'period', 'date_from', 'date_to', 'search', 'contact_id']),
        ]);
    }

    /**
     * Display tickets pending authorization.
     *
     * @return \Inertia\Response
     */
    public function authorizationsIndex(Request $request)
    {
        /** @var User $user */
        $user = Auth::user();
        
        \Log::info('Filtros recebidos:', $request->all());
        
        $baseQuery = Ticket::where('tenant_id', $user->tenant_id)
            ->where('status', 'PENDING_AUTHORIZATION');
        
        $query = clone $baseQuery;
        $query->with(['service', 'assignee', 'user', 'client', 'contact']);
        
        // Busca por termo
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('id', 'like', "%{$search}%");
            });
        }
        
        // Filtro por cliente
        if ($request->filled('client_id') && $request->client_id !== 'all') {
            \Log::info('Filtrando por cliente:', ['client_id' => $request->client_id]);
            $query->where('client_id', $request->client_id);
        }
        
        // Filtro por período
        if ($request->filled('period') && $request->period !== 'all') {
            $days = match($request->period) {
                '7' => 7,
                '15' => 15,
                '30' => 30,
                default => null,
            };
            
            if ($days) {
                $date = now()->subDays($days);
                \Log::info('Filtrando por período:', ['days' => $days, 'date' => $date]);
                $query->where('updated_at', '>=', $date);
            }
        }
        
        // Filtro por data customizada
        if ($request->filled('date_from')) {
            \Log::info('Filtrando por data inicial:', ['date_from' => $request->date_from]);
            $query->whereDate('updated_at', '>=', $request->date_from);
        }
        
        if ($request->filled('date_to')) {
            \Log::info('Filtrando por data final:', ['date_to' => $request->date_to]);
            $query->whereDate('updated_at', '<=', $request->date_to);
        }
        
        // Filtro por responsável
        if ($request->filled('assignee_id') && $request->assignee_id !== 'all') {
            \Log::info('Filtrando por responsável:', ['assignee_id' => $request->assignee_id]);
            $query->where('assignee_id', $request->assignee_id);
        }
        
        // Filtro por solicitante (contact)
        if ($request->filled('contact_id') && $request->contact_id !== 'all') {
            \Log::info('Filtrando por solicitante:', ['contact_id' => $request->contact_id]);
            $query->where('contact_id', $request->contact_id);
        }
        
        // Paginação de 5 itens por página
        $tickets = $query->latest('created_at')->paginate(5);
        
        \Log::info('Total de autorizações pendentes encontradas:', ['count' => $tickets->total()]);
        
        // Calcular estatísticas para os cards
        $stats = [
            'total' => (clone $baseQuery)->count(),
            'today' => (clone $baseQuery)->whereDate('created_at', today())->count(),
            'week' => (clone $baseQuery)->where('created_at', '>=', now()->subDays(7))->count(),
            'urgent' => (clone $baseQuery)->where('priority', 'LIKE', '%Crítica%')->count(),
        ];
        
        // Lista de clientes para o filtro
        $clients = Client::where('tenant_id', $user->tenant_id)
            ->orderBy('name')
            ->get(['id', 'name']);
        
        // Lista de técnicos (responsáveis) para o filtro
        $technicians = User::where('tenant_id', $user->tenant_id)
            ->whereIn('role', ['ADMIN', 'TECHNICIAN'])
            ->orderBy('name')
            ->get(['id', 'name']);
        
        // Lista de contatos (solicitantes) para o filtro
        $contacts = \App\Models\Contact::where('tenant_id', $user->tenant_id)
            ->orderBy('name')
            ->get(['id', 'name']);
        
        return Inertia::render('Tickets/Authorizations', [
            'tickets' => $tickets,
            'stats' => $stats,
            'clients' => $clients,
            'technicians' => $technicians,
            'contacts' => $contacts,
            'filters' => $request->only(['client_id', 'period', 'date_from', 'date_to', 'search', 'assignee_id', 'contact_id']),
        ]);
    }

    /**
     * Display closed tickets.
     *
     * @return \Inertia\Response
     */
    public function closedIndex(Request $request)
    {
        /** @var User $user */
        $user = Auth::user();
        
        \Log::info('Filtros recebidos:', $request->all());
        
        $baseQuery = Ticket::where('tenant_id', $user->tenant_id)
            ->where('status', 'CLOSED');
        
        $query = clone $baseQuery;
        $query->with(['service', 'assignee', 'user', 'client', 'contact']);
        
        // Filtro rápido (críticos, alta, meus tickets)
        if ($request->filled('quick_filter')) {
            switch ($request->quick_filter) {
                case 'critical':
                    $query->where('priority', 'Crítica');
                    break;
                case 'high':
                    $query->where('priority', 'Alta');
                    break;
                case 'my_tickets':
                    $query->where('assignee_id', $user->id);
                    break;
            }
        }
        
        // Busca por termo
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('id', 'like', "%{$search}%");
            });
        }
        
        // Filtro por cliente
        if ($request->filled('client_id') && $request->client_id !== 'all') {
            \Log::info('Filtrando por cliente:', ['client_id' => $request->client_id]);
            $query->where('client_id', $request->client_id);
        }
        
        // Filtro por período
        if ($request->filled('period') && $request->period !== 'all') {
            $days = match($request->period) {
                '7' => 7,
                '15' => 15,
                '30' => 30,
                default => null,
            };
            
            if ($days) {
                $date = now()->subDays($days);
                \Log::info('Filtrando por período:', ['days' => $days, 'date' => $date]);
                $query->where('updated_at', '>=', $date);
            }
        }
        
        // Filtro por data customizada
        if ($request->filled('date_from')) {
            \Log::info('Filtrando por data inicial:', ['date_from' => $request->date_from]);
            $query->whereDate('updated_at', '>=', $request->date_from);
        }
        
        if ($request->filled('date_to')) {
            \Log::info('Filtrando por data final:', ['date_to' => $request->date_to]);
            $query->whereDate('updated_at', '<=', $request->date_to);
        }
        
        // Filtro por responsável
        if ($request->filled('assignee_id') && $request->assignee_id !== 'all') {
            \Log::info('Filtrando por responsável:', ['assignee_id' => $request->assignee_id]);
            $query->where('assignee_id', $request->assignee_id);
        }
        
        // Filtro por solicitante (contact)
        if ($request->filled('contact_id') && $request->contact_id !== 'all') {
            \Log::info('Filtrando por solicitante:', ['contact_id' => $request->contact_id]);
            $query->where('contact_id', $request->contact_id);
        }
        
        // Paginação de 5 itens por página
        $tickets = $query->latest('updated_at')->paginate(5);
        
        \Log::info('Total de tickets encontrados:', ['count' => $tickets->total()]);
        
        // Calcular estatísticas para os cards
        $stats = [
            'total' => (clone $baseQuery)->count(),
            'critical' => (clone $baseQuery)->where('priority', 'Crítica')->count(),
            'high' => (clone $baseQuery)->where('priority', 'Alta')->count(),
            'my_tickets' => (clone $baseQuery)->where('assignee_id', $user->id)->count(),
        ];
        
        // Lista de clientes para o filtro
        $clients = Client::where('tenant_id', $user->tenant_id)
            ->orderBy('name')
            ->get(['id', 'name']);
        
        // Lista de técnicos (responsáveis) para o filtro
        $technicians = User::where('tenant_id', $user->tenant_id)
            ->whereIn('role', ['ADMIN', 'TECHNICIAN'])
            ->orderBy('name')
            ->get(['id', 'name']);
        
        // Lista de contatos (solicitantes) para o filtro
        $contacts = \App\Models\Contact::where('tenant_id', $user->tenant_id)
            ->orderBy('name')
            ->get(['id', 'name']);
        
        return Inertia::render('Tickets/Closed', [
            'tickets' => $tickets,
            'stats' => $stats,
            'clients' => $clients,
            'technicians' => $technicians,
            'contacts' => $contacts,
            'filters' => $request->only(['client_id', 'period', 'date_from', 'date_to', 'quick_filter', 'search', 'assignee_id', 'contact_id']),
        ]);
    }

    /**
     * Export filtered tickets to CSV.
     *
     * @param Request $request
     * @return \Symfony\Component\HttpFoundation\StreamedResponse
     */
    public function exportCsv(Request $request)
    {
        /** @var User $user */
        $user = Auth::user();
        
        // Construir mesma query dos filtros
        $query = Ticket::where('tenant_id', $user->tenant_id)
            ->whereIn('status', ['OPEN', 'IN_PROGRESS'])
            ->with(['service', 'assignee', 'user', 'client', 'contact']);
        
        // Aplicar todos os filtros
        if ($request->filled('quick_filter')) {
            switch ($request->quick_filter) {
                case 'critical':
                    $query->where('priority', 'LIKE', '%Crítica%');
                    break;
                case 'high':
                    $query->where('priority', 'LIKE', '%Alta%');
                    break;
                case 'my_tickets':
                    $query->where('assignee_id', $user->id);
                    break;
            }
        }
        
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('id', 'like', "%{$search}%");
            });
        }
        
        if ($request->filled('client_id') && $request->client_id !== 'all') {
            $query->where('client_id', $request->client_id);
        }
        
        if ($request->filled('period') && $request->period !== 'all') {
            $days = match($request->period) {
                '7' => 7,
                '15' => 15,
                '30' => 30,
                default => null,
            };
            if ($days) {
                $query->where('updated_at', '>=', now()->subDays($days));
            }
        }
        
        if ($request->filled('date_from')) {
            $query->whereDate('updated_at', '>=', $request->date_from);
        }
        
        if ($request->filled('date_to')) {
            $query->whereDate('updated_at', '<=', $request->date_to);
        }
        
        if ($request->filled('assignee_id') && $request->assignee_id !== 'all') {
            $query->where('assignee_id', $request->assignee_id);
        }
        
        if ($request->filled('contact_id') && $request->contact_id !== 'all') {
            $query->where('contact_id', $request->contact_id);
        }
        
        $tickets = $query->latest('updated_at')->get();
        
        $fileName = 'tickets_abertos_' . now()->format('Y-m-d_His') . '.csv';
        
        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
        ];
        
        return response()->stream(function() use ($tickets) {
            $file = fopen('php://output', 'w');
            
            // BOM para UTF-8
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));
            
            // Cabeçalhos
            fputcsv($file, [
                'ID',
                'Título',
                'Cliente',
                'Solicitante',
                'Mesa de Serviço',
                'Prioridade',
                'Status',
                'Responsável',
                'Criado em',
                'Atualizado em'
            ], ';');
            
            // Dados
            foreach ($tickets as $ticket) {
                fputcsv($file, [
                    $ticket->id,
                    $ticket->title,
                    $ticket->client->name ?? '-',
                    $ticket->contact->name ?? '-',
                    $ticket->service->name ?? '-',
                    $ticket->priority,
                    $ticket->status,
                    $ticket->assignee->name ?? 'Não atribuído',
                    $ticket->created_at->format('d/m/Y H:i'),
                    $ticket->updated_at->format('d/m/Y H:i'),
                ], ';');
            }
            
            fclose($file);
        }, 200, $headers);
    }

    /**
     * Convert pre-ticket to regular ticket.
     *
     * @param Ticket $ticket
     * @return \Illuminate\Http\RedirectResponse
     */
    public function convertPreTicket(Ticket $ticket)
    {
        // Verificar se é um pré-ticket
        if ($ticket->status !== 'PRE_TICKET') {
            return back()->with('error', 'Este ticket não é um pré-ticket.');
        }
        
        // Converter para ticket normal (aberto)
        $ticket->update([
            'status' => 'OPEN',
            'stage' => 'PENDENTE',
        ]);
        
        return back()->with('success', 'Pré-ticket convertido em ticket com sucesso!');
    }

    /**
     * Discard pre-ticket.
     *
     * @param Ticket $ticket
     * @return \Illuminate\Http\RedirectResponse
     */
    public function discardPreTicket(Ticket $ticket)
    {
        // Verificar se é um pré-ticket
        if ($ticket->status !== 'PRE_TICKET') {
            return back()->with('error', 'Este ticket não é um pré-ticket.');
        }
        
        // Marcar como cancelado/descartado
        $ticket->update([
            'status' => 'CANCELED',
        ]);
        
        return back()->with('success', 'Pré-ticket descartado com sucesso!');
    }

    /**
     * Authorize a ticket pending authorization.
     *
     * @param Ticket $ticket
     * @return \Illuminate\Http\RedirectResponse
     */
    public function authorizeTicket(Ticket $ticket)
    {
        // Verificar se está pendente de autorização
        if ($ticket->status !== 'PENDING_AUTHORIZATION') {
            return back()->with('error', 'Este ticket não está pendente de autorização.');
        }
        
        // Aprovar e converter para ticket aberto
        $ticket->update([
            'status' => 'OPEN',
            'stage' => 'PENDENTE',
        ]);
        
        return back()->with('success', 'Ticket autorizado com sucesso!');
    }

    /**
     * Deny authorization for a ticket.
     *
     * @param Ticket $ticket
     * @return \Illuminate\Http\RedirectResponse
     */
    public function denyAuthorization(Ticket $ticket)
    {
        // Verificar se está pendente de autorização
        if ($ticket->status !== 'PENDING_AUTHORIZATION') {
            return back()->with('error', 'Este ticket não está pendente de autorização.');
        }
        
        // Negar e marcar como cancelado
        $ticket->update([
            'status' => 'CANCELED',
        ]);
        
        return back()->with('success', 'Autorização negada. Ticket cancelado.');
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param string $id
     * @return \Illuminate\Http\RedirectResponse
     */
    public function destroy(string $id)
    {
        $ticket = Ticket::query()->findOrFail($id);

        // Check if the user is authorized to delete the ticket
        if ($ticket->user_id !== Auth::id()) {
            abort(403, "Unauthorized action.");
        }

        $ticket->delete();

        return redirect()
            ->route("tickets.index")
            ->with("success", "Ticket deleted successfully.");
    }
}
