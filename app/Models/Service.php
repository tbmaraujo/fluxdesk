<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Service extends Model
{
    use HasFactory;
    use \App\Models\Traits\BelongsToTenant;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        "name",
        "ticket_type_id",
        "review_type",
        "review_time_limit",
        "allow_reopen_after_review",
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'review_time_limit' => 'integer',
        'allow_reopen_after_review' => 'boolean',
    ];

    /**
     * Get the tickets for this service.
     */
    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class);
    }

    /**
     * Get the ticket type that owns this service.
     */
    public function ticketType(): BelongsTo
    {
        return $this->belongsTo(TicketType::class);
    }

    /**
     * Get the priorities for this service.
     */
    public function priorities(): HasMany
    {
        return $this->hasMany(Priority::class);
    }

    /**
     * Get the clients that have access to this service.
     */
    public function clients(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(Client::class, 'client_service')
            ->withTimestamps()
            ->wherePivot('tenant_id', auth()->user()->tenant_id ?? null);
    }

    /**
     * Get the groups that have access to this service.
     */
    public function groups(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(Group::class, 'group_service')
            ->withTimestamps()
            ->wherePivot('tenant_id', auth()->user()->tenant_id ?? null);
    }

    /**
     * Get the expedients for this service.
     */
    public function expedients(): HasMany
    {
        return $this->hasMany(ServiceExpedient::class);
    }

    /**
     * Get the stages for this service.
     */
    public function stages(): HasMany
    {
        return $this->hasMany(ServiceStage::class);
    }
}
