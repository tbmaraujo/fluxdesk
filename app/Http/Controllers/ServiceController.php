<?php

namespace App\Http\Controllers;

use App\Models\Service;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ServiceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $tenantId = auth()->user()->tenant_id;
        
        $services = Service::where('tenant_id', $tenantId)
            ->with(['ticketType', 'priorities'])
            ->withCount([
                'tickets as tickets_count' => function ($query) {
                    $query->whereMonth('created_at', now()->month)
                        ->whereYear('created_at', now()->year);
                }
            ])
            ->get()
            ->map(function ($service) {
                // Determinar o status da mesa (sempre ativa por padrão)
                $service->is_active = true;
                
                // Adicionar informações de SLA baseado nas prioridades configuradas
                if ($service->priorities && $service->priorities->isNotEmpty()) {
                    // Pegar a prioridade com menor tempo de resposta (mais crítica)
                    $fastestPriority = $service->priorities->sortBy('response_sla_time')->first();
                    
                    // Converter minutos para horas
                    $responseHours = round($fastestPriority->response_sla_time / 60, 1);
                    
                    if ($responseHours < 1) {
                        $service->sla_info = sprintf('%d min resposta', $fastestPriority->response_sla_time);
                    } else {
                        $service->sla_info = sprintf('%.1fh resposta', $responseHours);
                    }
                } else {
                    $service->sla_info = 'SLA: não configurado';
                }
                
                // Determinar badges de status/configuração
                $service->badges = [];
                
                if ($service->review_type) {
                    if ($service->review_type === 'requester') {
                        $service->badges[] = ['label' => 'Auto-aprovação', 'variant' => 'info'];
                    } elseif ($service->review_type === 'permission') {
                        $service->badges[] = ['label' => 'Aprovação Pendente', 'variant' => 'warning'];
                    } elseif ($service->review_type === 'both') {
                        $service->badges[] = ['label' => 'Revisão Configurada', 'variant' => 'success'];
                    }
                }
                
                return $service;
            });

        return Inertia::render('Settings/Services/Index', [
            'services' => $services,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Service $service): Response
    {
        $this->authorize('update', $service);

        $service->load(['ticketType', 'priorities', 'clients', 'groups', 'expedients', 'stages']);

        // Buscar todos os clientes do tenant para o select
        $availableClients = \App\Models\Client::where('tenant_id', auth()->user()->tenant_id)
            ->orderBy('name')
            ->get(['id', 'name']);

        // Buscar todos os grupos do tenant para o select
        $availableGroups = \App\Models\Group::where('tenant_id', auth()->user()->tenant_id)
            ->orderBy('name')
            ->get(['id', 'name', 'description']);

        return Inertia::render('Settings/Services/Edit', [
            'service' => $service,
            'availableClients' => $availableClients,
            'availableGroups' => $availableGroups,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Service $service): RedirectResponse
    {
        $this->authorize('update', $service);

        $validated = $request->validate([
            'review_type' => 'nullable|string|in:requester,permission,both',
            'review_time_limit' => 'nullable|integer|min:0',
            'allow_reopen_after_review' => 'boolean',
        ]);

        $service->update($validated);

        return redirect()
            ->route('settings.services.edit', $service)
            ->with('success', 'Configurações atualizadas com sucesso!');
    }

    /**
     * Attach a client to the service.
     */
    public function attachClient(Request $request, Service $service): RedirectResponse
    {
        $this->authorize('update', $service);

        $validated = $request->validate([
            'client_id' => 'required|exists:clients,id',
        ]);

        // Verificar se o cliente pertence ao mesmo tenant
        $client = \App\Models\Client::where('id', $validated['client_id'])
            ->where('tenant_id', auth()->user()->tenant_id)
            ->firstOrFail();

        // Verificar se já não está associado
        if ($service->clients()->where('client_id', $client->id)->exists()) {
            return back()->with('error', 'Este cliente já está associado a esta mesa de serviço.');
        }

        // Associar o cliente
        $service->clients()->attach($client->id, [
            'tenant_id' => auth()->user()->tenant_id,
        ]);

        return redirect()
            ->route('settings.services.edit', $service)
            ->with('success', 'Cliente associado com sucesso!');
    }

    /**
     * Detach a client from the service.
     */
    public function detachClient(Service $service, \App\Models\Client $client): RedirectResponse
    {
        $this->authorize('update', $service);

        // Verificar se o cliente pertence ao mesmo tenant
        if ($client->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        // Desassociar o cliente
        $service->clients()->detach($client->id);

        return redirect()
            ->route('settings.services.edit', $service)
            ->with('success', 'Cliente removido com sucesso!');
    }

    /**
     * Attach a group to the service.
     */
    public function attachGroup(Request $request, Service $service): RedirectResponse
    {
        $this->authorize('update', $service);

        $validated = $request->validate([
            'group_id' => 'required|exists:groups,id',
        ]);

        // Verificar se o grupo pertence ao mesmo tenant
        $group = \App\Models\Group::where('id', $validated['group_id'])
            ->where('tenant_id', auth()->user()->tenant_id)
            ->firstOrFail();

        // Verificar se já não está associado
        if ($service->groups()->where('group_id', $group->id)->exists()) {
            return back()->with('error', 'Este grupo já está associado a esta mesa de serviço.');
        }

        // Associar o grupo
        $service->groups()->attach($group->id, [
            'tenant_id' => auth()->user()->tenant_id,
        ]);

        return redirect()
            ->route('settings.services.edit', $service)
            ->with('success', 'Grupo associado com sucesso!');
    }

    /**
     * Detach a group from the service.
     */
    public function detachGroup(Service $service, \App\Models\Group $group): RedirectResponse
    {
        $this->authorize('update', $service);

        // Verificar se o grupo pertence ao mesmo tenant
        if ($group->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        // Desassociar o grupo
        $service->groups()->detach($group->id);

        return redirect()
            ->route('settings.services.edit', $service)
            ->with('success', 'Grupo removido com sucesso!');
    }
}
