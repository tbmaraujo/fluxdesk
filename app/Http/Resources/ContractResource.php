<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContractResource extends JsonResource
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
            'tenant_id' => $this->tenant_id,
            'client_id' => $this->client_id,
            'contract_type_id' => $this->contract_type_id,
            'name' => $this->name,
            'technical_notes' => $this->technical_notes,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'client' => $this->whenLoaded('client', function () {
                return [
                    'id' => $this->client?->id,
                    'name' => $this->client?->name,
                    'document' => $this->client?->document,
                ];
            }),
            'contractType' => $this->whenLoaded('contractType', function () {
                return [
                    'id' => $this->contractType?->id,
                    'name' => $this->contractType?->name,
                    'modality' => $this->contractType?->modality,
                ];
            }),
            'activeVersion' => $this->whenLoaded('activeVersion', fn () => ContractVersionResource::make($this->activeVersion)),
            'versions' => ContractVersionResource::collection($this->whenLoaded('versions') ?? []),
            'items' => $this->whenLoaded('items', function () {
                return $this->items->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'name' => $item->name,
                        'unit_value' => $item->unit_value,
                        'quantity' => $item->quantity,
                        'total_value' => $item->total_value,
                    ];
                });
            }),
            'notifications' => ContractNotificationResource::collection($this->whenLoaded('notifications') ?? []),
            'displacements' => ContractDisplacementResource::collection($this->whenLoaded('displacements') ?? []),
        ];
    }
}
