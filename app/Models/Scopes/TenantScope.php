<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;
use Illuminate\Support\Facades\Auth;

class TenantScope implements Scope
{
    /**
     * Apply the scope to a given Eloquent query builder.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $builder
     * @param  \Illuminate\Database\Eloquent\Model  $model
     * @return void
     */
    public function apply(Builder $builder, Model $model)
    {
        // Durante o processo de autenticação (login), não aplicar o escopo
        // Isso permite que qualquer usuário de qualquer tenant possa fazer login
        if (!Auth::check()) {
            return;
        }

        // Se o usuário estiver autenticado e for super admin, não aplicar o escopo
        $user = Auth::user();
        if ($user && isset($user->is_super_admin) && $user->is_super_admin === true) {
            return;
        }

        // Verificar se o tenant atual está definido no container
        if (!app()->bound('currentTenant')) {
            return;
        }

        $tenant = app('currentTenant');
        
        if (!$tenant) {
            return;
        }

        // Aplicar o filtro de tenant_id
        $builder->where($model->getTable() . '.tenant_id', $tenant->id);
    }
}
