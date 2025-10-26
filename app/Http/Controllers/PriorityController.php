<?php

namespace App\Http\Controllers;

use App\Models\Priority;
use App\Models\Service;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PriorityController extends Controller
{
    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request, Service $service): RedirectResponse
    {
        $this->authorize('update', $service);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'response_sla_time' => 'required|integer|min:0',
            'resolution_sla_time' => 'required|integer|min:0',
        ]);

        $service->priorities()->create([
            'tenant_id' => $request->user()->tenant_id,
            'name' => $validated['name'],
            'response_sla_time' => $validated['response_sla_time'],
            'resolution_sla_time' => $validated['resolution_sla_time'],
        ]);

        return redirect()
            ->route('settings.services.edit', $service)
            ->with('success', 'Prioridade criada com sucesso!');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Service $service, Priority $priority): RedirectResponse
    {
        $this->authorize('update', $service);

        // Verificar se a prioridade pertence ao serviço e ao tenant correto
        if ($priority->service_id !== $service->id || 
            $priority->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'response_sla_time' => 'required|integer|min:0',
            'resolution_sla_time' => 'required|integer|min:0',
        ]);

        $priority->update($validated);

        return redirect()
            ->route('settings.services.edit', $service)
            ->with('success', 'Prioridade atualizada com sucesso!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Service $service, Priority $priority): RedirectResponse
    {
        $this->authorize('update', $service);

        // Verificar se a prioridade pertence ao serviço e ao tenant correto
        if ($priority->service_id !== $service->id || 
            $priority->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $priority->delete();

        return redirect()
            ->route('settings.services.edit', $service)
            ->with('success', 'Prioridade removida com sucesso!');
    }
}
