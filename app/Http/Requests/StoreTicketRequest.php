<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTicketRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        \Log::info('=== VALIDAÇÃO DO TICKET REQUEST ===');
        \Log::info('Dados para validação:', $this->all());
        
        return [
            "title" => "required|string|max:255",
            "description" => "required|string",
            "service_id" => "required|exists:services,id",
            "contact_id" => "required|exists:contacts,id",
            "priority" => [
                "required",
                "string",
                function ($attribute, $value, $fail) {
                    $serviceId = $this->input('service_id');
                    $tenantId = auth()->user()->tenant_id;
                    
                    \Log::info('Validando prioridade:', [
                        'priority' => $value,
                        'service_id' => $serviceId,
                        'tenant_id' => $tenantId
                    ]);
                    
                    $priorityExists = \App\Models\Priority::where('tenant_id', $tenantId)
                        ->where('service_id', $serviceId)
                        ->where('name', $value)
                        ->exists();
                    
                    if (!$priorityExists) {
                        \Log::error('Prioridade não encontrada no banco:', [
                            'priority' => $value,
                            'service_id' => $serviceId,
                            'tenant_id' => $tenantId
                        ]);
                        
                        // Listar prioridades disponíveis para debug
                        $availablePriorities = \App\Models\Priority::where('tenant_id', $tenantId)
                            ->where('service_id', $serviceId)
                            ->pluck('name')
                            ->toArray();
                        
                        \Log::error('Prioridades disponíveis:', $availablePriorities);
                        
                        $fail('A prioridade selecionada não é válida para esta mesa de serviço.');
                    } else {
                        \Log::info('✅ Prioridade validada com sucesso');
                    }
                },
            ],
            "parent_id" => "nullable|exists:tickets,id",
            "attachments" => "nullable|array",
            "attachments.*" => "file|max:10240", // 10MB por arquivo
        ];
    }
    
    /**
     * Handle a failed validation attempt.
     */
    protected function failedValidation(\Illuminate\Contracts\Validation\Validator $validator)
    {
        \Log::error('=== VALIDAÇÃO FALHOU ===');
        \Log::error('Erros de validação:', $validator->errors()->toArray());
        
        parent::failedValidation($validator);
    }
}
