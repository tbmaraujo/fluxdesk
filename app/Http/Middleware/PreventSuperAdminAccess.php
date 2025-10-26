<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PreventSuperAdminAccess
{
    /**
     * Handle an incoming request.
     * 
     * Bloqueia o acesso de Super Admins às rotas operacionais dos Tenants.
     * Super Admins devem ficar restritos ao painel de administração da plataforma.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Verificar se o usuário está autenticado
        if (!auth()->check()) {
            return $next($request);
        }

        // Verificar se o usuário é Super Admin
        if (auth()->user()->isSuperAdmin()) {
            // Super Admin tentou acessar área operacional - BLOQUEAR
            \Log::warning('Super Admin tentou acessar área operacional', [
                'user_id' => auth()->user()->id,
                'user_name' => auth()->user()->name,
                'email' => auth()->user()->email,
                'url' => $request->url(),
                'ip' => $request->ip(),
                'is_super_admin' => auth()->user()->is_super_admin,
            ]);

            // Se for requisição Inertia/AJAX, abortar com 403
            if ($request->expectsJson() || $request->header('X-Inertia')) {
                abort(403, 'Super Admins não têm acesso às áreas operacionais. Você está restrito ao Painel de Administração da Plataforma.');
            }

            // Se for requisição normal, redirecionar
            return redirect()
                ->route('superadmin.tenants.index')
                ->with('error', 'Super Admins não têm acesso às áreas operacionais. Você está restrito ao Painel de Administração da Plataforma.');
        }

        return $next($request);
    }
}
