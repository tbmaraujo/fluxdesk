<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class CreateSuperAdmin extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'user:create-super-admin 
                            {--email= : Email do super admin}
                            {--name= : Nome do super admin}
                            {--password= : Senha do super admin}
                            {--tenant-slug= : Slug do tenant (padrão: sincro8)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Cria um usuário super administrador';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('🔧 Criando Super Administrador...');
        $this->newLine();

        // Coletar dados
        $email = $this->option('email') ?: $this->ask('Email do Super Admin', 'admin@fluxdesk.com.br');
        $name = $this->option('name') ?: $this->ask('Nome completo', 'Super Administrador');
        $password = $this->option('password') ?: $this->secret('Senha (mínimo 8 caracteres)');
        $tenantSlug = $this->option('tenant-slug') ?: $this->ask('Slug do Tenant', 'sincro8');

        // Validar
        $validator = Validator::make([
            'email' => $email,
            'name' => $name,
            'password' => $password,
        ], [
            'email' => 'required|email',
            'name' => 'required|string|min:3',
            'password' => 'required|string|min:8',
        ]);

        if ($validator->fails()) {
            $this->error('❌ Erro de validação:');
            foreach ($validator->errors()->all() as $error) {
                $this->error('  • ' . $error);
            }
            return Command::FAILURE;
        }

        // Buscar ou criar tenant
        $tenant = Tenant::where('slug', $tenantSlug)->first();

        if (!$tenant) {
            $this->warn("⚠️  Tenant '{$tenantSlug}' não encontrado. Criando...");
            $tenantName = $this->ask('Nome do Tenant', 'FluxDesk');
            $tenantDomain = $this->ask('Domínio do Tenant', 'app.fluxdesk.com.br');

            $tenant = Tenant::create([
                'slug' => $tenantSlug,
                'name' => $tenantName,
                'cnpj' => '00.000.000/0000-00',
                'domain' => $tenantDomain,
                'is_active' => true,
            ]);

            $this->info("✅ Tenant '{$tenant->name}' criado!");
        }

        // Verificar se usuário já existe
        $existingUser = User::where('email', $email)->first();

        if ($existingUser) {
            $this->warn("⚠️  Usuário com email '{$email}' já existe.");
            
            if ($this->confirm('Deseja atualizar para Super Admin?', true)) {
                $existingUser->update([
                    'name' => $name,
                    'password' => Hash::make($password),
                    'is_super_admin' => true,
                    'role' => 'admin',
                    'tenant_id' => $tenant->id,
                ]);

                $this->newLine();
                $this->info('✅ Usuário atualizado com sucesso!');
                $this->displayUserInfo($existingUser);
                
                return Command::SUCCESS;
            }

            return Command::FAILURE;
        }

        // Criar super admin
        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password' => Hash::make($password),
            'role' => 'admin',
            'tenant_id' => $tenant->id,
            'is_super_admin' => true,
        ]);

        $this->newLine();
        $this->info('🎉 Super Administrador criado com sucesso!');
        $this->displayUserInfo($user);

        return Command::SUCCESS;
    }

    private function displayUserInfo(User $user): void
    {
        $this->newLine();
        $this->line('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->line('  <fg=cyan>📋 CREDENCIAIS DE ACESSO</>');
        $this->line('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->line('  Nome:        <fg=green>' . $user->name . '</>');
        $this->line('  Email:       <fg=green>' . $user->email . '</>');
        $this->line('  Função:      <fg=green>' . ucfirst($user->role) . '</>');
        $this->line('  Super Admin: <fg=green>' . ($user->is_super_admin ? 'SIM' : 'NÃO') . '</>');
        $this->line('  Tenant:      <fg=green>' . $user->tenant->name . '</>');
        $this->line('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->newLine();
        $this->info('🌐 Acesse: https://app.fluxdesk.com.br/login');
        $this->newLine();
    }
}
