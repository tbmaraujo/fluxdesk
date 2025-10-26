<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContractNotificationResource extends JsonResource
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
            'email' => $this->email,
            'days_before' => $this->days_before,
            'on_cancellation' => $this->on_cancellation,
            'on_adjustment' => $this->on_adjustment,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
