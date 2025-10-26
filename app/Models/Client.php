<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Client extends Model
{
    use HasFactory;
    use \App\Models\Traits\BelongsToTenant;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'name',
        'trade_name',
        'legal_name',
        'document',
        'state_registration',
        'municipal_registration',
        'workplace',
        'notes',
        'visible_to_clients',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'visible_to_clients' => 'boolean',
    ];

    /**
     * Get the addresses associated with the client.
     */
    public function addresses(): HasMany
    {
        return $this->hasMany(Address::class);
    }

    /**
     * Get the contacts (solicitantes) associated with the client.
     */
    public function contacts(): HasMany
    {
        return $this->hasMany(Contact::class);
    }

    /**
     * Get the contracts associated with the client.
     */
    public function contracts(): HasMany
    {
        return $this->hasMany(Contract::class);
    }
}
