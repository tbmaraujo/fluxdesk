<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use App\Models\Service;

class Group extends Model
{
    use HasFactory;
    use \App\Models\Traits\BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'name',
        'description',
    ];

    /**
     * Get the services that this group has access to.
     */
    public function services(): BelongsToMany
    {
        return $this->belongsToMany(Service::class, 'group_service')
            ->withTimestamps()
            ->wherePivot('tenant_id', auth()->user()->tenant_id ?? null);
    }

    /**
     * Get the users that belong to this group.
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'group_user')
            ->withTimestamps()
            ->wherePivot('tenant_id', $this->tenant_id ?? auth()->user()->tenant_id ?? null);
    }
}
