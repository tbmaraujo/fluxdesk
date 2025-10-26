<?php

namespace App\Http\Controllers;

use App\Models\Contract;
use App\Models\ContractDisplacement;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ContractDisplacementController extends Controller
{
    /**
     * Store a newly created displacement.
     */
    public function store(Request $request, Contract $contract): RedirectResponse
    {
        $this->authorize('update', $contract);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'value' => 'required|numeric|min:0',
            'quantity_included' => 'required|integer|min:0',
        ]);

        $contract->displacements()->create([
            'tenant_id' => $request->user()->tenant_id,
            'name' => $validated['name'],
            'value' => $validated['value'],
            'quantity_included' => $validated['quantity_included'],
        ]);

        return redirect()
            ->route('contracts.show', $contract)
            ->with('success', 'Deslocamento adicionado com sucesso!');
    }

    /**
     * Remove the specified displacement.
     */
    public function destroy(Contract $contract, ContractDisplacement $displacement): RedirectResponse
    {
        $this->authorize('update', $contract);

        // Verificar se o deslocamento pertence ao contrato e ao tenant correto
        if ($displacement->contract_id !== $contract->id || $displacement->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $displacement->delete();

        return redirect()
            ->route('contracts.show', $contract)
            ->with('success', 'Deslocamento removido com sucesso!');
    }
}
