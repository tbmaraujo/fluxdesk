<?php

namespace App\Http\Controllers;

use App\Models\Service;
use App\Models\ServiceStage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ServiceStageController extends Controller
{
    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'service_id' => 'required|exists:services,id',
            'name' => 'required|string|max:255',
            'sla_time' => 'required|string', // formato "0000:00"
        ]);

        $user = Auth::user();

        // Converter formato "0000:00" para minutos
        $slaMinutes = $this->convertTimeFormatToMinutes($validated['sla_time']);

        ServiceStage::create([
            'tenant_id' => $user->tenant_id,
            'service_id' => $validated['service_id'],
            'name' => $validated['name'],
            'sla_time' => $slaMinutes,
        ]);

        return redirect()->back()->with('success', 'Estágio criado com sucesso!');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, ServiceStage $serviceStage): RedirectResponse
    {
        $user = Auth::user();

        // Verificar se o estágio pertence ao tenant do usuário
        if ($serviceStage->tenant_id !== $user->tenant_id) {
            abort(403, 'Não autorizado.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sla_time' => 'required|string', // formato "0000:00"
        ]);

        // Converter formato "0000:00" para minutos
        $slaMinutes = $this->convertTimeFormatToMinutes($validated['sla_time']);

        $serviceStage->update([
            'name' => $validated['name'],
            'sla_time' => $slaMinutes,
        ]);

        return redirect()->back()->with('success', 'Estágio atualizado com sucesso!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ServiceStage $serviceStage): RedirectResponse
    {
        $user = Auth::user();

        // Verificar se o estágio pertence ao tenant do usuário
        if ($serviceStage->tenant_id !== $user->tenant_id) {
            abort(403, 'Não autorizado.');
        }

        $serviceStage->delete();

        return redirect()->back()->with('success', 'Estágio excluído com sucesso!');
    }

    /**
     * Converter formato "0000:00" para minutos
     */
    private function convertTimeFormatToMinutes(string $timeFormat): int
    {
        // Formato: "0000:00" onde 0000 são horas e 00 são minutos
        $parts = explode(':', $timeFormat);
        $hours = (int) ($parts[0] ?? 0);
        $minutes = (int) ($parts[1] ?? 0);
        
        return ($hours * 60) + $minutes;
    }
}
