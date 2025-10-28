<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TenantEmailAddressRequest extends FormRequest
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
        $tenantEmailAddressId = $this->route('tenant_email_address')?->id;

        return [
            'email' => [
                'required',
                'email:rfc,dns',
                'max:255',
                Rule::unique('tenant_email_addresses', 'email')
                    ->ignore($tenantEmailAddressId)
                    ->where('tenant_id', $this->user()->tenant_id),
            ],
            'purpose' => ['required', Rule::in(['incoming', 'outgoing', 'both'])],
            'priority' => ['nullable', Rule::in(['high', 'normal', 'low'])],
            'client_filter' => ['nullable', 'string', 'max:255'],
            'verified' => ['nullable', 'boolean'],
            'active' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'email' => 'E-mail',
            'purpose' => 'Finalidade',
            'priority' => 'Prioridade',
            'client_filter' => 'Cliente',
            'verified' => 'Verificado',
            'active' => 'Ativo',
            'notes' => 'Observações',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'email.required' => 'O campo e-mail é obrigatório.',
            'email.email' => 'O e-mail fornecido não é válido.',
            'email.unique' => 'Este e-mail já está cadastrado para este tenant.',
            'purpose.required' => 'A finalidade é obrigatória.',
            'purpose.in' => 'Finalidade inválida.',
        ];
    }
}

