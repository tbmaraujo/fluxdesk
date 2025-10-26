<?php

namespace App\Http\Controllers;

use App\Models\ServiceExpedient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ServiceExpedientController extends Controller
{
    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'service_id' => 'required|exists:services,id',
            'days_of_week' => 'required|string',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
        ]);

        $user = Auth::user();

        ServiceExpedient::create([
            'tenant_id' => $user->tenant_id,
            'service_id' => $validated['service_id'],
            'days_of_week' => $validated['days_of_week'],
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
        ]);

        return redirect()->back()->with('success', 'Expediente criado com sucesso!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ServiceExpedient $serviceExpedient)
    {
        $user = Auth::user();

        // Verificar se o expediente pertence ao tenant do usuário
        if ($serviceExpedient->tenant_id !== $user->tenant_id) {
            abort(403, 'Não autorizado.');
        }

        $serviceExpedient->delete();

        return redirect()->back()->with('success', 'Expediente excluído com sucesso!');
    }
}
