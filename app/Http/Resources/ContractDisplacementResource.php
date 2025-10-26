<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContractDisplacementResource extends JsonResource
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
            'name' => $this->name,
            'value' => $this->value,
            'quantity_included' => $this->quantity_included,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
