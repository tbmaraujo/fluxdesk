<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class IdentifyTenant
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Se já tivermos um tenant definido, apenas continue
        if (app()->bound('currentTenant')) {
            return $next($request);
        }

        $tenant = null;
        
        try {
            // Se não houver usuário autenticado, não tentar identificar o tenant
            if (!auth()->check()) {
                return $next($request);
            }

            // Se o usuário for super admin, não definir tenant (acesso global)
            if (auth()->user()->is_super_admin === true) {
                \Log::info('SuperAdmin detectado - pulando identificação de tenant', [
                    'user_id' => auth()->user()->id,
                    'user_name' => auth()->user()->name,
                ]);
                return $next($request);
            }

            // Tentar identificar o tenant pelo usuário autenticado
            \Log::info('Verificando autenticação do usuário', [
                'is_authenticated' => true,
                'user_tenant_id' => auth()->user()->tenant_id ?? null,
                'user_id' => auth()->user()->id,
                'user_name' => auth()->user()->name,
            ]);
            
            if (auth()->user()->tenant_id) {
                $tenant = Tenant::withoutGlobalScopes()
                    ->where('id', auth()->user()->tenant_id)
                    ->where('is_active', true)
                    ->first();
            }
            
            // Se não encontrou pelo usuário, tentar pelo domínio/subdomínio
            if (!$tenant) {
                $host = $request->getHost();
                $domain = config('app.domain');
                
                // Se estiver em ambiente local ou o domínio for o principal, usar o primeiro tenant ativo
                if (app()->environment('local') || $host === $domain) {
                    $tenant = Tenant::withoutGlobalScopes()
                        ->where('is_active', true)
                        ->first();
                } else {
                    // Extrair o subdomínio (ex: tenant1.meudominio.com -> tenant1)
                    $subdomain = str_replace('.' . $domain, '', $host);
                    
                    // Procurar por um tenant com este domínio ou subdomínio
                    $tenant = Tenant::withoutGlobalScopes()
                        ->where(function($query) use ($host, $subdomain) {
                            $query->where('domain', $host)
                                  ->orWhere('slug', $subdomain);
                        })
                        ->where('is_active', true)
                        ->first();
                }
            }

            // Se não encontrar o tenant, retornar um erro 404 ou redirecionar
            if (!$tenant) {
                Log::warning("Tentativa de acesso a tenant não encontrado");
                abort(404, 'Organização não encontrada ou inativa.');
            }

            // Registrar o tenant atual no container de serviços
            app()->instance('currentTenant', $tenant);
            
            // Adicionar o tenant ao request para uso posterior
            $request->attributes->add(['currentTenant' => $tenant]);
            
            // Definir o tenant atual para o contexto de banco de dados
            $this->setTenantForDatabase($tenant);

        } catch (\Exception $e) {
            Log::error("Erro ao identificar tenant: " . $e->getMessage());
            abort(500, 'Erro ao carregar a organização. Por favor, tente novamente mais tarde.');
        }

        return $next($request);
    }
    
    /**
     * Configura o tenant atual para o contexto de banco de dados.
     *
     * @param  \App\Models\Tenant  $tenant
     * @return void
     */
    protected function setTenantForDatabase(Tenant $tenant)
    {
        // Aqui você pode configurar a conexão de banco de dados específica do tenant, se necessário
        // Por enquanto, vamos apenas definir o tenant_id para ser usado nos modelos
        config(['tenant_id' => $tenant->id]);
    }
}
