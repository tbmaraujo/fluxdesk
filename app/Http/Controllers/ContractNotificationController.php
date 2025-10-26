<?php

namespace App\Http\Controllers;

use App\Models\Contract;
use App\Models\ContractNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ContractNotificationController extends Controller
{
    /**
     * Store a newly created notification rule.
     */
    public function store(Request $request, Contract $contract): RedirectResponse
    {
        $this->authorize('update', $contract);

        $validated = $request->validate([
            'email' => 'required|email|max:255',
            'days_before' => 'required|integer|min:0|max:365',
            'on_cancellation' => 'boolean',
            'on_adjustment' => 'boolean',
        ]);

        $contract->notifications()->create([
            'tenant_id' => $request->user()->tenant_id,
            'email' => $validated['email'],
            'days_before' => $validated['days_before'],
            'on_cancellation' => $validated['on_cancellation'] ?? false,
            'on_adjustment' => $validated['on_adjustment'] ?? false,
        ]);

        return redirect()
            ->route('contracts.show', $contract)
            ->with('success', 'Notificação cadastrada com sucesso!');
    }

    /**
     * Remove the specified notification rule.
     */
    public function destroy(Contract $contract, ContractNotification $notification): RedirectResponse
    {
        $this->authorize('update', $contract);

        // Verificar se a notificação pertence ao contrato e ao tenant correto
        if ($notification->contract_id !== $contract->id || $notification->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $notification->delete();

        return redirect()
            ->route('contracts.show', $contract)
            ->with('success', 'Notificação removida com sucesso!');
    }
}
