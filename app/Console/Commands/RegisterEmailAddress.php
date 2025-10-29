<?php

namespace App\Console\Commands;

use App\Models\Client;
use App\Models\Priority;
use App\Models\Service;
use App\Models\Tenant;
use App\Models\TenantEmailAddress;
use Illuminate\Console\Command;

class RegisterEmailAddress extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'email:register 
                          {email : E-mail a ser registrado (ex: suporte@tickets.fluxdesk.com.br)}
                          {--tenant= : ID ou slug do tenant}
                          {--service= : ID do serviço (opcional)}
                          {--priority= : ID da prioridade (opcional)}
                          {--client= : ID do cliente (opcional)}
                          {--purpose=incoming : Propósito: incoming, outgoing ou both}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Registra um endereço de e-mail para receber tickets via Mailgun/SES';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $email = strtolower(trim($this->argument('email')));
        
        // Validar formato de e-mail
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->error("❌ E-mail inválido: {$email}");
            return 1;
        }

        // Buscar tenant
        $tenantIdentifier = $this->option('tenant');
        
        if ($tenantIdentifier) {
            // Buscar por ID ou slug
            $tenant = is_numeric($tenantIdentifier)
                ? Tenant::find($tenantIdentifier)
                : Tenant::where('slug', $tenantIdentifier)->first();
            
            if (!$tenant) {
                $this->error("❌ Tenant não encontrado: {$tenantIdentifier}");
                return 1;
            }
        } else {
            // Listar tenants disponíveis
            $tenants = Tenant::where('is_active', true)->get(['id', 'name', 'slug']);
            
            if ($tenants->isEmpty()) {
                $this->error('❌ Nenhum tenant ativo encontrado!');
                return 1;
            }
            
            $this->info('📋 Tenants disponíveis:');
            $tenants->each(function ($t) {
                $this->line("  [{$t->id}] {$t->name} (slug: {$t->slug})");
            });
            
            $tenantId = $this->ask('Digite o ID do tenant');
            $tenant = Tenant::find($tenantId);
            
            if (!$tenant) {
                $this->error("❌ Tenant não encontrado: {$tenantId}");
                return 1;
            }
        }

        // Verificar se já existe
        $existing = TenantEmailAddress::where('email', $email)
            ->where('tenant_id', $tenant->id)
            ->first();
        
        if ($existing) {
            $this->warn("⚠️  E-mail já cadastrado!");
            $this->table(
                ['Campo', 'Valor'],
                [
                    ['ID', $existing->id],
                    ['E-mail', $existing->email],
                    ['Tenant', $tenant->name],
                    ['Propósito', $existing->purpose],
                    ['Ativo', $existing->active ? '✅ Sim' : '❌ Não'],
                    ['Serviço', $existing->service_id ?? 'Padrão'],
                    ['Prioridade', $existing->priority_id ?? 'Padrão'],
                ]
            );
            
            if (!$this->confirm('Deseja atualizar?', false)) {
                return 0;
            }
        }

        // Buscar serviço
        $serviceId = $this->option('service');
        if (!$serviceId) {
            $service = Service::where('tenant_id', $tenant->id)->first();
            if (!$service) {
                $this->error("❌ Nenhum serviço encontrado para o tenant {$tenant->name}");
                return 1;
            }
            $serviceId = $service->id;
            $this->info("ℹ️  Usando serviço padrão: {$service->name} (ID: {$serviceId})");
        }

        // Buscar prioridade
        $priorityId = $this->option('priority');
        if (!$priorityId) {
            $priority = Priority::where('service_id', $serviceId)->first();
            if ($priority) {
                $priorityId = $priority->id;
                $this->info("ℹ️  Usando prioridade padrão: {$priority->name} (ID: {$priorityId})");
            } else {
                $this->warn('⚠️  Nenhuma prioridade encontrada. Será definida ao criar o ticket.');
            }
        }

        // Cliente (opcional)
        $clientId = $this->option('client');
        if (!$clientId) {
            $client = Client::where('tenant_id', $tenant->id)->first();
            if ($client) {
                $clientId = $client->id;
                $this->info("ℹ️  Usando cliente padrão: {$client->name} (ID: {$clientId})");
            }
        }

        // Propósito
        $purpose = $this->option('purpose');
        if (!in_array($purpose, ['incoming', 'outgoing', 'both'])) {
            $this->error("❌ Propósito inválido: {$purpose}. Use: incoming, outgoing ou both");
            return 1;
        }

        // Criar ou atualizar
        $data = [
            'tenant_id' => $tenant->id,
            'email' => $email,
            'purpose' => $purpose,
            'service_id' => $serviceId,
            'priority_id' => $priorityId,
            'client_filter' => $clientId,
            'active' => true,
            'verified' => true,
            'verified_at' => now(),
        ];

        if ($existing) {
            $existing->update($data);
            $emailAddress = $existing;
            $action = 'atualizado';
        } else {
            $emailAddress = TenantEmailAddress::create($data);
            $action = 'cadastrado';
        }

        $this->info("✅ E-mail {$action} com sucesso!");
        $this->newLine();
        
        $this->table(
            ['Campo', 'Valor'],
            [
                ['ID', $emailAddress->id],
                ['E-mail', $emailAddress->email],
                ['Tenant', $tenant->name . " (ID: {$tenant->id})"],
                ['Propósito', $emailAddress->purpose],
                ['Serviço', $emailAddress->service_id],
                ['Prioridade', $emailAddress->priority_id ?? 'N/A'],
                ['Cliente', $emailAddress->client_filter ?? 'N/A'],
                ['Ativo', $emailAddress->active ? '✅ Sim' : '❌ Não'],
            ]
        );

        $this->newLine();
        $this->info('🎯 Próximos passos:');
        $this->line("1. Configure o Mailgun Route para encaminhar para: {$email}");
        $this->line("2. Envie um e-mail de teste para: {$email}");
        $this->line("3. Monitore os logs: tail -f storage/logs/laravel.log");

        return 0;
    }
}

