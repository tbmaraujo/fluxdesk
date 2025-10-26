<?php

namespace App\Http\Controllers;

use App\Models\Tenant;
use App\Models\User;
use Database\Seeders\ContractTypeSeeder;
use Database\Seeders\GroupSeeder;
use Database\Seeders\PrioritySeeder;
use Database\Seeders\ServiceSeeder;
use Database\Seeders\TicketTypeSeeder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;

class SuperAdminController extends Controller
{
    /**
     * Display a listing of tenants.
     */
    public function index()
    {
        $tenants = Tenant::withCount('users')
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('SuperAdmin/Tenants/Index', [
            'tenants' => $tenants,
        ]);
    }

    /**
     * Show the form for creating a new tenant.
     */
    public function create()
    {
        return Inertia::render('SuperAdmin/Tenants/Create');
    }

    /**
     * Store a newly created tenant and its admin user.
     */
    public function store(Request $request)
    {
        \Log::info('SuperAdminController@store - Iniciando criação de tenant');
        \Log::info('Dados recebidos:', $request->all());

        $validated = $request->validate([
            'company_name' => 'required|string|max:255',
            'company_cnpj' => 'required|string|max:20|unique:tenants,cnpj',
            'admin_name' => 'required|string|max:255',
            'admin_email' => 'required|email|unique:users,email',
            'admin_password' => 'required|string|min:8',
        ], [
            'company_name.required' => 'O nome da empresa é obrigatório.',
            'company_cnpj.required' => 'O CNPJ é obrigatório.',
            'company_cnpj.unique' => 'Este CNPJ já está cadastrado.',
            'admin_name.required' => 'O nome do administrador é obrigatório.',
            'admin_email.required' => 'O email do administrador é obrigatório.',
            'admin_email.email' => 'O email deve ser válido.',
            'admin_email.unique' => 'Este email já está em uso.',
            'admin_password.required' => 'A senha é obrigatória.',
            'admin_password.min' => 'A senha deve ter no mínimo 8 caracteres.',
        ]);

        \Log::info('Validação passou com sucesso');

        try {
            DB::beginTransaction();

            $cnpj = preg_replace('/\D/', '', $validated['company_cnpj']);

            // 1. Criar o Tenant
            // Gerar slug numérico de 14 dígitos
            do {
                $slug = mt_rand(10000000000000, 99999999999999); // 14 dígitos
            } while (Tenant::withTrashed()->where('slug', $slug)->exists());

            $tenant = Tenant::create([
                'name' => $validated['company_name'],
                'cnpj' => $cnpj,
                'slug' => $slug,
                'domain' => null, // Pode ser configurado depois
                'is_active' => true,
            ]);

            \Log::info('Tenant criado com ID: ' . $tenant->id);

            // 2. Criar o usuário administrador do tenant
            $admin = User::create([
                'name' => $validated['admin_name'],
                'email' => $validated['admin_email'],
                'password' => Hash::make($validated['admin_password']),
                'role' => 'ADMIN', // Role de admin dentro do tenant
                'tenant_id' => $tenant->id,
                'is_super_admin' => false,
            ]);

            \Log::info('Admin criado com ID: ' . $admin->id);

            // 3. Configurar currentTenant e executar seeders necessários
            app()->instance('currentTenant', $tenant);
            
            \Log::info('Executando TicketTypeSeeder para tenant: ' . $tenant->id);
            (new TicketTypeSeeder())->run();
            
            \Log::info('Executando ServiceSeeder para tenant: ' . $tenant->id);
            (new ServiceSeeder())->run();
            
            \Log::info('Executando PrioritySeeder para tenant: ' . $tenant->id);
            (new PrioritySeeder())->run();
            
            \Log::info('Executando GroupSeeder para tenant: ' . $tenant->id);
            (new GroupSeeder())->run();
            
            \Log::info('Executando ContractTypeSeeder para tenant: ' . $tenant->id);
            (new ContractTypeSeeder())->run();
            
            \Log::info('Seeders executados com sucesso');

            DB::commit();

            \Log::info('Tenant criado com sucesso! Redirecionando...');

            return redirect()
                ->route('superadmin.tenants.index')
                ->with('success', 'Tenant criado com sucesso! O administrador pode fazer login com as credenciais fornecidas.');

        } catch (\Exception $e) {
            DB::rollBack();

            \Log::error('Erro ao criar tenant: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());

            return back()
                ->withErrors(['error' => 'Erro ao criar tenant: ' . $e->getMessage()])
                ->withInput();
        }
    }

    /**
     * Update the tenant status.
     */
    public function updateStatus(Tenant $tenant)
    {
        $tenant->update([
            'is_active' => !$tenant->is_active,
        ]);

        $status = $tenant->is_active ? 'ativado' : 'desativado';

        return back()->with('success', "Tenant {$status} com sucesso!");
    }

    /**
     * Remove the specified tenant.
     */
    public function destroy(Tenant $tenant)
    {
        try {
            DB::beginTransaction();

            // Soft delete do tenant (se estiver usando SoftDeletes)
            $tenant->delete();

            DB::commit();

            return redirect()
                ->route('superadmin.tenants.index')
                ->with('success', 'Tenant removido com sucesso!');

        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withErrors(['error' => 'Erro ao remover tenant: ' . $e->getMessage()]);
        }
    }
}
