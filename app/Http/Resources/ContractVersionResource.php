<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContractVersionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'contract_id' => $this->contract_id,
            'tenant_id' => $this->tenant_id,
            'user_id' => $this->user_id,
            'version' => $this->version,
            'is_active_version' => $this->is_active_version,
            'description' => $this->description,
            'activity_type' => $this->activity_type,
            'start_date' => $this->start_date,
            'renewal_date' => $this->renewal_date,
            'expiration_term' => $this->expiration_term,
            'auto_renewal' => $this->auto_renewal,
            'status' => $this->status,
            'monthly_value' => $this->monthly_value,
            'payment_day' => $this->payment_day,
            'due_day' => $this->due_day,
            'discount' => $this->discount,
            'billing_cycle' => $this->billing_cycle,
            'closing_cycle' => $this->closing_cycle,
            'payment_method' => $this->payment_method,
            'billing_type' => $this->billing_type,
            'contract_term' => $this->contract_term,
            'included_hours' => $this->included_hours,
            'extra_hour_value' => $this->extra_hour_value,
            'scope_included' => $this->scope_included,
            'scope_excluded' => $this->scope_excluded,
            'fair_use_policy' => $this->fair_use_policy,
            'visit_limit' => $this->visit_limit,
            'included_tickets' => $this->included_tickets,
            'extra_ticket_value' => $this->extra_ticket_value,
            'rollover_active' => $this->rollover_active,
            'rollover_days_window' => $this->rollover_days_window,
            'rollover_hours_limit' => $this->rollover_hours_limit,
            'appointments_when_pending' => $this->appointments_when_pending,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'user' => $this->whenLoaded('user', function () {
                return [
                    'id' => $this->user?->id,
                    'name' => $this->user?->name,
                    'email' => $this->user?->email,
                ];
            }),
        ];
    }
}
