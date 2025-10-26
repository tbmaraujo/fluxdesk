<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Priority extends Model
{
    use HasFactory;
    use \App\Models\Traits\BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'service_id',
        'name',
        'response_sla_time',
        'resolution_sla_time',
    ];

    protected $casts = [
        'response_sla_time' => 'integer',
        'resolution_sla_time' => 'integer',
    ];

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }
}
