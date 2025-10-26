<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ServiceStage extends Model
{
    use HasFactory;
    use \App\Models\Traits\BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'service_id',
        'name',
        'sla_time',
    ];

    protected $casts = [
        'sla_time' => 'integer',
    ];

    /**
     * Get the service that owns the stage.
     */
    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }
}
