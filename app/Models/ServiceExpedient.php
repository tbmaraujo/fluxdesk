<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ServiceExpedient extends Model
{
    use HasFactory;
    use \App\Models\Traits\BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'service_id',
        'days_of_week',
        'start_time',
        'end_time',
    ];

    /**
     * Get the service that owns the expedient.
     */
    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }
}
