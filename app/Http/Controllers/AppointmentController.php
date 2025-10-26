<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AppointmentController extends Controller
{
    /**
     * Store a newly created appointment in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Ticket  $ticket
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store(Request $request, Ticket $ticket)
    {
        // Validação customizada: deslocamento obrigatório para serviço externo
        $rules = [
            "description" => "required|string|max:1000",
            "start_time" => "required|date",
            "end_time" => "required|date|after_or_equal:start_time",
            "is_billable" => "boolean",
            "service_type" => "required|string|in:Interno,Externo,Remoto",
            "billing_type" => "required|string|in:Contrato,Avulso",
            "contract_id" => "nullable|exists:contracts,id",
            "displacement_id" => "nullable|exists:displacements,id",
        ];
        
        // Se o serviço for Externo, deslocamento é obrigatório
        if ($request->input('service_type') === 'Externo') {
            $rules['displacement_id'] = 'required|exists:displacements,id';
        }
        
        $validated = $request->validate($rules, [
            'displacement_id.required' => 'O deslocamento é obrigatório para serviços externos.',
        ]);

        // Calculate duration in minutes
        $startTime = Carbon::parse($validated["start_time"]);
        $endTime = Carbon::parse($validated["end_time"]);
        
        // Verificar se o fim é antes do início (problema de timezone)
        if ($endTime->lt($startTime)) {
            return back()->withErrors(['end_time' => 'O horário de fim deve ser posterior ao horário de início.']);
        }
        
        $durationInMinutes = $startTime->diffInMinutes($endTime);

        // Get displacement cost if displacement is selected
        $travelCost = 0;
        if (!empty($validated["displacement_id"])) {
            $displacement = \App\Models\Displacement::query()->find(
                $validated["displacement_id"],
            );
            $travelCost = $displacement ? $displacement->cost : 0;
        }

        // Converter strings vazias em null
        $displacementId = !empty($validated["displacement_id"]) ? $validated["displacement_id"] : null;
        $contractId = !empty($validated["contract_id"]) ? $validated["contract_id"] : null;
        
        // Log para debug
        \Log::info('Creating appointment', [
            'displacement_id_raw' => $validated["displacement_id"] ?? null,
            'displacement_id_final' => $displacementId,
            'service_type' => $validated["service_type"],
        ]);
        
        // Create the appointment
        $appointment = $ticket->appointments()->create([
            "user_id" => Auth::id(),
            "description" => $validated["description"],
            "start_time" => $validated["start_time"],
            "end_time" => $validated["end_time"],
            "duration_in_minutes" => $durationInMinutes,
            "is_billable" => $validated["is_billable"] ?? true,
            "service_type" => $validated["service_type"],
            "billing_type" => $validated["billing_type"],
            "travel_cost" => $travelCost,
            "contract_id" => $contractId,
            "displacement_id" => $displacementId,
        ]);

        return back()->with("success", "Apontamento criado com sucesso!");
    }

    /**
     * Update the specified appointment in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Ticket  $ticket
     * @param  int  $appointment
     * @return \Illuminate\Http\RedirectResponse
     */
    public function update(Request $request, Ticket $ticket, $appointment)
    {
        $appointmentModel = $ticket->appointments()->findOrFail($appointment);
        
        // Verificar permissões
        $user = Auth::user();
        $isAdmin = $user->is_super_admin || $user->groups()->where('name', 'Administradores')->exists();
        
        // Administrador pode editar sempre
        // Usuário comum só pode editar se o ticket estiver aberto
        if (!$isAdmin && $ticket->status !== 'OPEN') {
            return back()->with('error', 'Você não tem permissão para editar apontamentos em tickets fechados.');
        }
        
        // Validação customizada: deslocamento obrigatório para serviço externo
        $rules = [
            "description" => "required|string|max:1000",
            "start_time" => "required|date",
            "end_time" => "required|date|after_or_equal:start_time",
            "is_billable" => "boolean",
            "service_type" => "required|string|in:Interno,Externo,Remoto",
            "billing_type" => "required|string|in:Contrato,Avulso",
            "contract_id" => "nullable|exists:contracts,id",
            "displacement_id" => "nullable|exists:displacements,id",
        ];
        
        // Se o serviço for Externo, deslocamento é obrigatório
        if ($request->input('service_type') === 'Externo') {
            $rules['displacement_id'] = 'required|exists:displacements,id';
        }
        
        $validated = $request->validate($rules, [
            'displacement_id.required' => 'O deslocamento é obrigatório para serviços externos.',
        ]);

        // Calculate duration in minutes
        $startTime = Carbon::parse($validated["start_time"]);
        $endTime = Carbon::parse($validated["end_time"]);
        
        // Verificar se o fim é antes do início (problema de timezone)
        if ($endTime->lt($startTime)) {
            return back()->withErrors(['end_time' => 'O horário de fim deve ser posterior ao horário de início.']);
        }
        
        $durationInMinutes = $startTime->diffInMinutes($endTime);

        // Get displacement cost if displacement is selected
        $travelCost = 0;
        if (!empty($validated["displacement_id"])) {
            $displacement = \App\Models\Displacement::query()->find(
                $validated["displacement_id"],
            );
            $travelCost = $displacement ? $displacement->cost : 0;
        }

        // Converter strings vazias em null
        $displacementId = !empty($validated["displacement_id"]) ? $validated["displacement_id"] : null;
        $contractId = !empty($validated["contract_id"]) ? $validated["contract_id"] : null;

        // Update the appointment
        $appointmentModel->update([
            "description" => $validated["description"],
            "start_time" => $validated["start_time"],
            "end_time" => $validated["end_time"],
            "duration_in_minutes" => $durationInMinutes,
            "is_billable" => $validated["is_billable"] ?? true,
            "service_type" => $validated["service_type"],
            "billing_type" => $validated["billing_type"],
            "travel_cost" => $travelCost,
            "contract_id" => $contractId,
            "displacement_id" => $displacementId,
        ]);

        return back()->with("success", "Apontamento atualizado com sucesso!");
    }

    /**
     * Remove the specified appointment from storage.
     *
     * @param  \App\Models\Ticket  $ticket
     * @param  int  $appointment
     * @return \Illuminate\Http\RedirectResponse
     */
    public function destroy(Ticket $ticket, $appointment)
    {
        $appointmentModel = $ticket->appointments()->findOrFail($appointment);
        
        // Só pode excluir se o ticket estiver aberto
        if ($ticket->status !== 'OPEN') {
            return back()->with('error', 'Apontamentos só podem ser excluídos em tickets abertos.');
        }
        
        $appointmentModel->delete();
        
        return back()->with("success", "Apontamento excluído com sucesso!");
    }
}
