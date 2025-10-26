<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Contract extends Model
{
    use HasFactory;
    use \App\Models\Traits\BelongsToTenant;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'tenant_id',
        'client_id',
        'contract_type_id',
        'name',
        'technical_notes',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        //
    ];

    /**
     * Get the client that owns the contract.
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    /**
     * Get the contract type associated with the contract.
     */
    public function contractType(): BelongsTo
    {
        return $this->belongsTo(ContractType::class);
    }

    /**
     * Get the appointments for this contract.
     */
    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }

    /**
     * Get all versions of this contract.
     */
    public function versions(): HasMany
    {
        return $this->hasMany(ContractVersion::class)->orderBy('version', 'desc');
    }

    /**
     * Get the active version of this contract.
     */
    public function activeVersion(): HasOne
    {
        return $this->hasOne(ContractVersion::class)->where('is_active_version', true);
    }

    /**
     * Get the items for this contract (SaaS/Produto modality).
     * Note: Items are now associated with versions, but we keep this for backward compatibility.
     */
    public function items(): HasMany
    {
        return $this->hasMany(ContractItem::class);
    }

    /**
     * Get the notifications for this contract.
     */
    public function notifications(): HasMany
    {
        return $this->hasMany(ContractNotification::class);
    }

    /**
     * Get the displacements for this contract.
     */
    public function displacements(): HasMany
    {
        return $this->hasMany(ContractDisplacement::class);
    }
}
