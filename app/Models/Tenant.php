<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Tenant extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'cnpj',
        'slug',
        'domain',
        'data',
        'is_active',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'data' => 'array',
        'is_active' => 'boolean',
    ];

    /**
     * Get the users for the tenant.
     */
    public function users()
    {
        return $this->hasMany(User::class);
    }

    /**
     * Get the clients for the tenant.
     */
    public function clients()
    {
        return $this->hasMany(Client::class);
    }

    /**
     * Get the tickets for the tenant.
     */
    public function tickets()
    {
        return $this->hasMany(Ticket::class);
    }

    /**
     * Get the services for the tenant.
     */
    public function services()
    {
        return $this->hasMany(Service::class);
    }

    /**
     * Get the displacements for the tenant.
     */
    public function displacements()
    {
        return $this->hasMany(Displacement::class);
    }

    /**
     * Get the active tenant based on the current request.
     *
     * @return \App\Models\Tenant|null
     */
    public static function current()
    {
        return app('currentTenant');
    }
}
