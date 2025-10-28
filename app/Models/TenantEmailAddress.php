<?php

namespace App\Models;

use App\Models\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantEmailAddress extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id',
        'email',
        'purpose',
        'priority',
        'client_filter',
        'verified',
        'verified_at',
        'active',
        'notes',
    ];

    protected $casts = [
        'verified' => 'boolean',
        'verified_at' => 'datetime',
        'active' => 'boolean',
    ];

    /**
     * Relacionamento com tenant.
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Relacionamento com cliente (opcional).
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'client_filter');
    }

    /**
     * Scope para e-mails ativos.
     */
    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    /**
     * Scope para e-mails de entrada.
     */
    public function scopeIncoming($query)
    {
        return $query->whereIn('purpose', ['incoming', 'both']);
    }

    /**
     * Scope para e-mails de saída.
     */
    public function scopeOutgoing($query)
    {
        return $query->whereIn('purpose', ['outgoing', 'both']);
    }

    /**
     * Scope para e-mails verificados.
     */
    public function scopeVerified($query)
    {
        return $query->where('verified', true);
    }
}

