<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreContractRequest;
use App\Http\Requests\UpdateContractRequest;
use App\Http\Resources\ContractResource;
use App\Models\Client;
use App\Models\Contract;
use App\Models\ContractType;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ContractController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Contract::class);

        // Verificar se o usuário está autenticado e tem um tenant_id
        if (!$request->user()) {
            abort(403, 'Usuário não autenticado.');
        }

        $tenantId = $request->user()->tenant_id;
        
        if (!$tenantId) {
            abort(403, 'Usuário não está associado a nenhum tenant.');
        }

        $showExpired = $request->boolean('show_expired');

        // Calcular estatísticas
        $totalContracts = Contract::query()
            ->where('tenant_id', $tenantId)
            ->count();
        
        $activeContracts = Contract::query()
            ->where('tenant_id', $tenantId)
            ->whereHas('activeVersion', function ($query) {
                $query->where('status', 'Ativo');
            })
            ->count();
        
        $inactiveContracts = Contract::query()
            ->where('tenant_id', $tenantId)
            ->whereHas('activeVersion', function ($query) {
                $query->where('status', 'Inativo');
            })
            ->count();
        
        $upcomingRenewals = Contract::query()
            ->where('tenant_id', $tenantId)
            ->whereHas('activeVersion', function ($query) {
                $query->whereNotNull('renewal_date')
                    ->whereDate('renewal_date', '<=', now()->addMonth())
                    ->whereDate('renewal_date', '>=', now());
            })
            ->count();

        $contracts = Contract::query()
            ->where('tenant_id', $tenantId)
            ->with([
                'client:id,name',
                'contractType:id,name',
                'activeVersion',
            ])
            ->when($request->filled('search'), function ($query) use ($request) {
                $term = $request->string('search')->toString();

                $query->where(function ($subQuery) use ($term) {
                    $subQuery
                        ->where('name', 'like', "%{$term}%")
                        ->orWhereHas('client', function ($clientQuery) use ($term) {
                            $clientQuery->where('name', 'like', "%{$term}%");
                        });
                });
            })
            ->when($request->filled('status'), function ($query) use ($request) {
                $query->whereHas('activeVersion', function ($versionQuery) use ($request) {
                    $versionQuery->where('status', $request->string('status')->toString());
                });
            })
            ->when($request->filled('contract_type_id'), function ($query) use ($request) {
                $query->where('contract_type_id', $request->integer('contract_type_id'));
            })
            ->when($request->filled('client_id'), function ($query) use ($request) {
                $query->where('client_id', $request->integer('client_id'));
            })
            ->when($showExpired, function ($query) {
                $query->whereHas('activeVersion', function ($versionQuery) {
                    $versionQuery->whereNotNull('renewal_date')
                        ->whereDate('renewal_date', '<=', now()->addMonth());
                });
            })
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        $activeContractTypes = ContractType::query()
            ->where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        $clients = Client::query()
            ->where('tenant_id', $tenantId)
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Contracts/Index', [
            'contracts' => $contracts,
            'stats' => [
                'total' => $totalContracts,
                'active' => $activeContracts,
                'inactive' => $inactiveContracts,
                'upcoming_renewals' => $upcomingRenewals,
            ],
            'filters' => [
                'search' => $request->string('search')->toString(),
                'status' => $request->string('status')->toString(),
                'contract_type_id' => $request->filled('contract_type_id') ? (string) $request->input('contract_type_id') : '',
                'client_id' => $request->filled('client_id') ? (string) $request->input('client_id') : '',
                'show_expired' => $showExpired,
            ],
            'contractTypes' => $activeContractTypes,
            'clients' => $clients,
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Contract::class);

        $tenantId = auth()->user()->tenant_id;

        $contractTypes = ContractType::query()
            ->where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'modality']);

        $clients = Client::query()
            ->where('tenant_id', $tenantId)
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Contracts/Create', [
            'contractTypes' => $contractTypes,
            'clients' => $clients,
            'options' => [
                'paymentMethods' => ['Posterior', 'Antecipado', 'Mensal', 'Bimestral'],
                'billingCycles' => ['Mensal', 'Bimestral', 'Trimestral', 'Semestral', 'Anual'],
                'closingCycles' => ['Mensal', 'Bimestral', 'Trimestral', 'Semestral', 'Anual'],
                'expirationTerms' => ['Indeterminado', '12 meses', '24 meses', '36 meses'],
                'statuses' => ['Ativo', 'Inativo'],
            ],
        ]);
    }

    public function store(StoreContractRequest $request): RedirectResponse
    {
        $this->authorize('create', Contract::class);

        $data = $request->validated();
        $tenantId = $request->user()->tenant_id;

        // Extrair items se existirem (modalidade SaaS/Produto)
        $items = $data['items'] ?? [];
        unset($data['items']);

        // Separar dados do contrato "pai" dos dados da versão
        $contractData = [
            'tenant_id' => $tenantId,
            'client_id' => $data['client_id'],
            'contract_type_id' => $data['contract_type_id'],
            'name' => $data['name'],
            'technical_notes' => $data['technical_notes'] ?? null,
        ];

        // Dados da versão 1.0 (todos os campos financeiros e de vigência)
        $versionData = [
            'tenant_id' => $tenantId,
            'user_id' => $request->user()->id,
            'version' => '1.0',
            'is_active_version' => true,
            'description' => 'Versão inicial do contrato',
            'activity_type' => 'Criação de contrato',
            // Campos de Status e Vigência
            'start_date' => $data['start_date'] ?? null,
            'renewal_date' => $data['renewal_date'] ?? null,
            'expiration_term' => $data['expiration_term'] ?? null,
            'auto_renewal' => (bool) ($data['auto_renewal'] ?? false),
            'status' => $data['status'] ?? 'Ativo',
            // Campos de Condições Financeiras
            'monthly_value' => $data['monthly_value'] ?? null,
            'payment_day' => $data['payment_day'] ?? null,
            'due_day' => $data['due_day'] ?? null,
            'discount' => $data['discount'] ?? null,
            'billing_cycle' => $data['billing_cycle'] ?? null,
            'closing_cycle' => $data['closing_cycle'] ?? null,
            'payment_method' => $data['payment_method'] ?? null,
            'billing_type' => $data['billing_type'] ?? null,
            'contract_term' => $data['contract_term'] ?? null,
            // Campos da modalidade "Horas"
            'included_hours' => $data['included_hours'] ?? null,
            'extra_hour_value' => $data['extra_hour_value'] ?? null,
            // Campos da modalidade "Livre (Ilimitado)"
            'scope_included' => $data['scope_included'] ?? null,
            'scope_excluded' => $data['scope_excluded'] ?? null,
            'fair_use_policy' => $data['fair_use_policy'] ?? null,
            'visit_limit' => $data['visit_limit'] ?? null,
            // Campos da modalidade "Por Atendimento"
            'included_tickets' => $data['included_tickets'] ?? null,
            'extra_ticket_value' => $data['extra_ticket_value'] ?? null,
            // Campos da modalidade "Horas Cumulativas" (Rollover)
            'rollover_active' => (bool) ($data['rollover_active'] ?? false),
            'rollover_days_window' => $data['rollover_days_window'] ?? null,
            'rollover_hours_limit' => $data['rollover_hours_limit'] ?? null,
            // Campos da modalidade "SaaS/Produto"
            'appointments_when_pending' => (bool) ($data['appointments_when_pending'] ?? false),
        ];

        // Criar o contrato "pai"
        $contract = Contract::create($contractData);

        // Criar a versão 1.0
        $contract->versions()->create($versionData);

        // Criar items se existirem (modalidade SaaS/Produto)
        if (!empty($items)) {
            foreach ($items as $item) {
                $contract->items()->create([
                    'tenant_id' => $tenantId,
                    'name' => $item['name'],
                    'unit_value' => $item['unit_value'],
                    'quantity' => $item['quantity'],
                    'total_value' => $item['total_value'],
                ]);
            }
        }

        return redirect()
            ->route('contracts.show', $contract)
            ->with('success', 'Contrato criado com sucesso!');
    }

    public function show(Contract $contract): Response
    {
        $this->authorize('view', $contract);

        $contract->load([
            'client:id,name,document',
            'contractType:id,name,modality',
            'activeVersion.user:id,name,email',
            'versions' => function ($query) {
                $query->with('user:id,name,email')->orderBy('created_at', 'desc');
            },
            'items:id,contract_id,name,unit_value,quantity,total_value',
            'notifications:id,contract_id,tenant_id,email,days_before,on_cancellation,on_adjustment,created_at,updated_at',
            'displacements:id,contract_id,tenant_id,name,value,quantity_included,created_at,updated_at',
        ]);
        $contract->loadCount('appointments');

        return Inertia::render('Contracts/Show', [
            'contract' => $contract->toArray(),
            'hasAppointments' => $contract->appointments_count > 0,
        ]);
    }

    public function edit(Contract $contract): Response
    {
        $this->authorize('update', $contract);

        $contract->load(['client', 'contractType', 'activeVersion']);

        $tenantId = auth()->user()->tenant_id;

        $contractTypes = ContractType::query()
            ->where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'modality']);

        $clients = Client::query()
            ->where('tenant_id', $tenantId)
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Contracts/Edit', [
            'contract' => $contract,
            'contractTypes' => $contractTypes,
            'clients' => $clients,
            'options' => [
                'paymentMethods' => ['Posterior', 'Antecipado', 'Mensal', 'Bimestral'],
                'billingCycles' => ['Mensal', 'Bimestral', 'Trimestral', 'Semestral', 'Anual'],
                'closingCycles' => ['Mensal', 'Bimestral', 'Trimestral', 'Semestral', 'Anual'],
                'expirationTerms' => ['Indeterminado', '12 meses', '24 meses', '36 meses'],
                'statuses' => ['Ativo', 'Inativo'],
            ],
        ]);
    }

    public function update(UpdateContractRequest $request, Contract $contract): RedirectResponse
    {
        $this->authorize('update', $contract);

        // Bloquear edição se o contrato já possui apontamentos
        if ($contract->appointments()->count() > 0) {
            return redirect()
                ->route('contracts.show', $contract)
                ->with('error', 'Não é possível editar este contrato pois ele já possui apontamentos. Use a função "Gerar Adendo" para alterações.');
        }

        $data = $request->validated();
        if (! array_key_exists('auto_renewal', $data)) {
            $data['auto_renewal'] = $contract->auto_renewal;
        }

        $contract->update($data);

        return redirect()
            ->route('contracts.show', $contract)
            ->with('success', 'Contrato atualizado com sucesso!');
    }

    /**
     * Update safe fields (due_day, auto_renewal) that can be edited even with appointments.
     */
    public function updateSafeFields(Request $request, Contract $contract): RedirectResponse
    {
        $this->authorize('update', $contract);

        $validated = $request->validate([
            'due_day' => 'nullable|integer|min:1|max:31',
            'auto_renewal' => 'boolean',
        ]);

        // Atualizar a versão ativa do contrato
        $activeVersion = $contract->activeVersion;
        if ($activeVersion) {
            $activeVersion->update($validated);
        }

        return back()->with('success', 'Configuração atualizada com sucesso!');
    }

    /**
     * Show the form for creating a new addendum.
     */
    public function createAddendum(Contract $contract): Response
    {
        $this->authorize('update', $contract);

        return Inertia::render('Contracts/CreateAddendum', [
            'contract' => $contract->load(['client', 'contractType', 'activeVersion']),
        ]);
    }

    /**
     * Store a new addendum (version) for the contract.
     */
    public function storeAddendum(Request $request, Contract $contract): RedirectResponse
    {
        $this->authorize('update', $contract);

        $validated = $request->validate([
            'addendum_type' => 'required|in:renewal,during_term',
            'description' => 'required|string|max:500',
            'start_date' => 'required|date',
            'adjustment_type' => 'nullable|in:manual,percentage',
            'adjustment_percentage' => 'nullable|numeric|min:0|max:100',
            // Todos os campos financeiros e de vigência
            'monthly_value' => 'nullable|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'payment_day' => 'nullable|integer|min:1|max:31',
            'due_day' => 'nullable|integer|min:1|max:31',
            'payment_method' => 'nullable|string',
            'billing_cycle' => 'nullable|string',
            'closing_cycle' => 'nullable|string',
            'billing_type' => 'nullable|string',
            'contract_term' => 'nullable|string',
            'auto_renewal' => 'boolean',
            'status' => 'required|in:Ativo,Inativo',
            'renewal_date' => 'nullable|date',
            'expiration_term' => 'nullable|string',
            // Campos das modalidades
            'included_hours' => 'nullable|numeric|min:0',
            'extra_hour_value' => 'nullable|numeric|min:0',
            'scope_included' => 'nullable|string',
            'scope_excluded' => 'nullable|string',
            'fair_use_policy' => 'nullable|string',
            'visit_limit' => 'nullable|integer|min:0',
            'included_tickets' => 'nullable|integer|min:0',
            'extra_ticket_value' => 'nullable|numeric|min:0',
            'rollover_active' => 'boolean',
            'rollover_days_window' => 'nullable|integer|min:1',
            'rollover_hours_limit' => 'nullable|integer|min:1',
            'appointments_when_pending' => 'boolean',
        ]);

        // Desativar a versão atual
        $contract->activeVersion()->update(['is_active_version' => false]);

        // Calcular o próximo número de versão
        $lastVersion = $contract->versions()->orderBy('version', 'desc')->first();
        $nextVersion = $lastVersion ? (float) $lastVersion->version + 1.0 : 2.0;

        // Aplicar reajuste percentual se aplicável
        $monthlyValue = $validated['monthly_value'];
        if ($validated['addendum_type'] === 'renewal' && 
            $validated['adjustment_type'] === 'percentage' && 
            isset($validated['adjustment_percentage'])) {
            $currentValue = $contract->activeVersion->monthly_value ?? 0;
            $monthlyValue = $currentValue * (1 + ($validated['adjustment_percentage'] / 100));
        }

        // Determinar tipo de atividade
        $activityType = $validated['addendum_type'] === 'renewal' 
            ? 'Adendo no reajuste' 
            : 'Adendo durante vigência';

        // Criar a nova versão (adendo)
        $newVersion = $contract->versions()->create([
            'tenant_id' => $request->user()->tenant_id,
            'user_id' => $request->user()->id,
            'version' => number_format($nextVersion, 1, '.', ''),
            'is_active_version' => true,
            'description' => $validated['description'],
            'activity_type' => $activityType,
            'start_date' => $validated['start_date'],
            'renewal_date' => $validated['renewal_date'] ?? null,
            'expiration_term' => $validated['expiration_term'] ?? null,
            'auto_renewal' => $validated['auto_renewal'] ?? false,
            'status' => $validated['status'],
            'monthly_value' => $monthlyValue,
            'payment_day' => $validated['payment_day'] ?? null,
            'due_day' => $validated['due_day'] ?? null,
            'discount' => $validated['discount'] ?? null,
            'billing_cycle' => $validated['billing_cycle'] ?? null,
            'closing_cycle' => $validated['closing_cycle'] ?? null,
            'payment_method' => $validated['payment_method'] ?? null,
            'billing_type' => $validated['billing_type'] ?? null,
            'contract_term' => $validated['contract_term'] ?? null,
            'included_hours' => $validated['included_hours'] ?? null,
            'extra_hour_value' => $validated['extra_hour_value'] ?? null,
            'scope_included' => $validated['scope_included'] ?? null,
            'scope_excluded' => $validated['scope_excluded'] ?? null,
            'fair_use_policy' => $validated['fair_use_policy'] ?? null,
            'visit_limit' => $validated['visit_limit'] ?? null,
            'included_tickets' => $validated['included_tickets'] ?? null,
            'extra_ticket_value' => $validated['extra_ticket_value'] ?? null,
            'rollover_active' => $validated['rollover_active'] ?? false,
            'rollover_days_window' => $validated['rollover_days_window'] ?? null,
            'rollover_hours_limit' => $validated['rollover_hours_limit'] ?? null,
            'appointments_when_pending' => $validated['appointments_when_pending'] ?? false,
        ]);

        return redirect()
            ->route('contracts.show', $contract)
            ->with('success', "Adendo {$newVersion->version} gerado com sucesso!");
    }

    /**
     * Duplicate a contract with its active version.
     */
    public function duplicate(Contract $contract): RedirectResponse
    {
        $this->authorize('create', Contract::class);

        // Criar novo contrato (pai)
        $newContract = Contract::create([
            'tenant_id' => $contract->tenant_id,
            'client_id' => $contract->client_id,
            'contract_type_id' => $contract->contract_type_id,
            'name' => 'Cópia - ' . $contract->name,
            'technical_notes' => $contract->technical_notes,
        ]);

        // Copiar a versão ativa como versão 1.0 do novo contrato
        $activeVersion = $contract->activeVersion;
        if ($activeVersion) {
            $newContract->versions()->create([
                'tenant_id' => $contract->tenant_id,
                'user_id' => auth()->id(),
                'version' => '1.0',
                'is_active_version' => true,
                'description' => 'Versão inicial (duplicada)',
                'activity_type' => 'Duplicação de contrato',
                'start_date' => $activeVersion->start_date,
                'renewal_date' => $activeVersion->renewal_date,
                'expiration_term' => $activeVersion->expiration_term,
                'auto_renewal' => $activeVersion->auto_renewal,
                'status' => $activeVersion->status,
                'monthly_value' => $activeVersion->monthly_value,
                'payment_day' => $activeVersion->payment_day,
                'due_day' => $activeVersion->due_day,
                'discount' => $activeVersion->discount,
                'billing_cycle' => $activeVersion->billing_cycle,
                'closing_cycle' => $activeVersion->closing_cycle,
                'payment_method' => $activeVersion->payment_method,
                'billing_type' => $activeVersion->billing_type,
                'contract_term' => $activeVersion->contract_term,
                'included_hours' => $activeVersion->included_hours,
                'extra_hour_value' => $activeVersion->extra_hour_value,
                'scope_included' => $activeVersion->scope_included,
                'scope_excluded' => $activeVersion->scope_excluded,
                'fair_use_policy' => $activeVersion->fair_use_policy,
                'visit_limit' => $activeVersion->visit_limit,
                'included_tickets' => $activeVersion->included_tickets,
                'extra_ticket_value' => $activeVersion->extra_ticket_value,
                'rollover_active' => $activeVersion->rollover_active,
                'rollover_days_window' => $activeVersion->rollover_days_window,
                'rollover_hours_limit' => $activeVersion->rollover_hours_limit,
                'appointments_when_pending' => $activeVersion->appointments_when_pending,
            ]);
        }

        return redirect()
            ->route('contracts.edit', $newContract)
            ->with('success', 'Contrato duplicado com sucesso! Você pode editá-lo agora.');
    }

    /**
     * Cancel a contract by changing its active version status.
     */
    public function cancel(Contract $contract): RedirectResponse
    {
        $this->authorize('update', $contract);

        $activeVersion = $contract->activeVersion;
        if ($activeVersion) {
            $activeVersion->update([
                'status' => 'Cancelado',
                'auto_renewal' => false,
            ]);
        }

        return redirect()
            ->route('contracts.show', $contract)
            ->with('success', 'Contrato cancelado com sucesso!');
    }

    public function destroy(Contract $contract): RedirectResponse
    {
        $this->authorize('delete', $contract);

        $contract->delete();

        return redirect()
            ->route('contracts.index')
            ->with('success', 'Contrato removido com sucesso!');
    }
}
