<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

abstract class ContractRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        $data = [];

        if ($this->has('auto_renewal')) {
            $data['auto_renewal'] = filter_var($this->input('auto_renewal'), FILTER_VALIDATE_BOOLEAN);
        }

        if ($this->has('rollover_active')) {
            $data['rollover_active'] = filter_var($this->input('rollover_active'), FILTER_VALIDATE_BOOLEAN);
        }

        if ($this->has('appointments_when_pending')) {
            $data['appointments_when_pending'] = filter_var($this->input('appointments_when_pending'), FILTER_VALIDATE_BOOLEAN);
        }

        if ($this->has('monthly_value')) {
            $data['monthly_value'] = $this->normalizeDecimal($this->input('monthly_value'));
        }

        if ($this->has('discount')) {
            $data['discount'] = $this->normalizeDecimal($this->input('discount'));
        }

        if ($this->has('extra_hour_value')) {
            $data['extra_hour_value'] = $this->normalizeDecimal($this->input('extra_hour_value'));
        }

        if ($this->has('extra_ticket_value')) {
            $data['extra_ticket_value'] = $this->normalizeDecimal($this->input('extra_ticket_value'));
        }

        if (! empty($data)) {
            $this->merge($data);
        }
    }

    protected function baseRules(bool $isUpdate): array
    {
        $tenantId = $this->user()?->tenant_id;

        $requiredRule = $isUpdate ? 'sometimes' : 'required';

        $rules = [
            'name' => [$requiredRule, 'string', 'max:255'],
            'client_id' => [
                $requiredRule,
                'integer',
                Rule::exists('clients', 'id')->where('tenant_id', $tenantId),
            ],
            'contract_type_id' => [
                $requiredRule,
                'integer',
                Rule::exists('contract_types', 'id')->where('tenant_id', $tenantId)->where('is_active', true),
            ],
            'technical_notes' => ['nullable', 'string'],
            'start_date' => ['nullable', 'date'],
            'payment_day' => ['nullable', 'integer', 'min:1', 'max:31'],
            'due_day' => ['nullable', 'integer', 'min:1', 'max:31'],
            'monthly_value' => ['nullable', 'numeric', 'min:0'],
            'discount' => ['nullable', 'numeric', 'min:0'],
            'payment_method' => ['nullable', 'string', 'max:255'],
            'billing_cycle' => ['nullable', 'string', 'max:255'],
            'closing_cycle' => ['nullable', 'string', 'max:255'],
            'billing_type' => ['nullable', 'string', 'max:255'],
            'contract_term' => ['nullable', 'string', 'max:255'],
            'auto_renewal' => [$requiredRule, 'boolean'],
            'status' => [$requiredRule, 'string', 'in:Ativo,Inativo'],
            'renewal_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'expiration_term' => ['nullable', 'string', 'max:255'],
            // Modalidade "Horas"
            'included_hours' => ['nullable', 'numeric', 'min:0'],
            'extra_hour_value' => ['nullable', 'numeric', 'min:0'],
            // Modalidade "Livre (Ilimitado)"
            'scope_included' => ['nullable', 'string'],
            'scope_excluded' => ['nullable', 'string'],
            'fair_use_policy' => ['nullable', 'string'],
            'visit_limit' => ['nullable', 'integer', 'min:0'],
            // Modalidade "Por Atendimento"
            'included_tickets' => ['nullable', 'integer', 'min:0'],
            'extra_ticket_value' => ['nullable', 'numeric', 'min:0'],
            // Modalidade "Horas Cumulativas" (Rollover)
            'rollover_active' => ['nullable', 'boolean'],
            'rollover_days_window' => ['nullable', 'integer', 'min:0'],
            'rollover_hours_limit' => ['nullable', 'numeric', 'min:0'],
            // Modalidade "SaaS/Produto"
            'appointments_when_pending' => ['nullable', 'boolean'],
            'items' => ['nullable', 'array'],
            'items.*.name' => ['required_with:items', 'string', 'max:255'],
            'items.*.unit_value' => ['required_with:items', 'numeric', 'min:0'],
            'items.*.quantity' => ['required_with:items', 'integer', 'min:1'],
            'items.*.total_value' => ['required_with:items', 'numeric', 'min:0'],
        ];

        if ($isUpdate) {
            $optionalFields = [
                'technical_notes', 'start_date', 'payment_day', 'due_day', 
                'monthly_value', 'discount', 'payment_method', 'billing_cycle', 
                'closing_cycle', 'billing_type', 'contract_term', 'renewal_date', 
                'expiration_term', 'included_hours', 'extra_hour_value', 
                'scope_included', 'scope_excluded', 'fair_use_policy', 'visit_limit',
                'included_tickets', 'extra_ticket_value', 'rollover_active',
                'rollover_days_window', 'rollover_hours_limit', 'appointments_when_pending'
            ];

            foreach ($rules as $key => $ruleSet) {
                if (in_array($key, $optionalFields)) {
                    array_unshift($rules[$key], 'sometimes');
                }
            }
        }

        return $rules;
    }

    protected function normalizeDecimal(mixed $value): mixed
    {
        if ($value === null || $value === '') {
            return null;
        }

        $plain = str_replace(['R$', ' '], '', (string) $value);

        if (Str::contains($plain, ',')) {
            $plain = str_replace('.', '', $plain);
            $plain = str_replace(',', '.', $plain);
        }

        if (! is_numeric($plain)) {
            return $value;
        }

        return number_format((float) $plain, 2, '.', '');
    }
}
