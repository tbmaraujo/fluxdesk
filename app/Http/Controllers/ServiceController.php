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
        $services = Service::where('tenant_id', auth()->user()->tenant_id)
            ->with('ticketType')
            ->get();

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
