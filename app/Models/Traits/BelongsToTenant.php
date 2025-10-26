<?php

namespace App\Models\Traits;

use App\Models\Scopes\TenantScope;

/**
 * Trait BelongsToTenant
 * 
 * Adiciona suporte a multi-tenancy para um modelo.
 * 
 * @package App\Models\Traits
 */
trait BelongsToTenant
{
    /**
     * The "booting" method of the model.
     *
     * @return void
     */
    protected static function bootBelongsToTenant()
    {
        static::addGlobalScope(new TenantScope);

        // Ao criar um novo modelo, definir automaticamente o tenant_id
        static::creating(function ($model) {
            // Só definir tenant_id se ainda não estiver definido
            if (!isset($model->tenant_id) || $model->tenant_id === null) {
                // Verificar se o tenant existe no container
                if (app()->bound('currentTenant')) {
                    $tenant = app('currentTenant');
                    if ($tenant && isset($tenant->id)) {
                        $model->tenant_id = $tenant->id;
                    }
                }
            }
        });
    }

    /**
     * Get the tenant that owns the model.
     */
    public function tenant()
    {
        return $this->belongsTo(\App\Models\Tenant::class);
    }
}
