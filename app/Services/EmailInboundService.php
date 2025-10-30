<?php

namespace App\Services;

use App\Mail\TicketCreatedNotification;
use App\Mail\TicketReplyNotification;
use App\Models\Attachment;
use App\Models\Client;
use App\Models\Contact;
use App\Models\Reply;
use App\Models\Service;
use App\Models\Tenant;
use App\Models\TenantEmailAddress;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;

class EmailInboundService
{
    /**
     * Alias para processInboundEmail (compatibilidade).
     *
     * @param array $payload
     * @return array
     */
    public function process(array $payload): array
    {
        return $this->processInboundEmail($payload);
    }

    /**
     * Process direct reply via HMAC-validated Reply-To.
     * Avoids loops by NOT sending notifications.
     *
     * @param int $ticketId
     * @param string|null $tenantSlug
     * @param string $fromEmail
     * @param array $payload
     * @param string $messageId
     * @return array
     */
    public function processDirectReply(
        int $ticketId,
        ?string $tenantSlug,
        string $fromEmail,
        array $payload,
        string $messageId
    ): array {
        try {
            // Buscar ticket
            $ticket = Ticket::with('tenant')->find($ticketId);
            
            if (!$ticket) {
                throw new \Exception("Ticket não encontrado: {$ticketId}");
            }

            // Validar tenant se slug foi fornecido
            if ($tenantSlug && $ticket->tenant->slug !== $tenantSlug) {
                throw new \Exception("Tenant slug mismatch. Expected: {$ticket->tenant->slug}, Got: {$tenantSlug}");
            }

            // Extrair conteúdo do e-mail (Mailgun format)
            $bodyPlain = $payload['body-plain'] ?? $payload['stripped-text'] ?? '';
            $bodyHtml = $payload['body-html'] ?? '';
            $strippedText = $payload['stripped-text'] ?? $bodyPlain;

            // Usar stripped-text (remove assinaturas) se disponível
            $content = !empty($strippedText) ? $strippedText : $bodyPlain;

            if (empty($content) && !empty($bodyHtml)) {
                // Fallback: converter HTML para texto
                $content = strip_tags($bodyHtml);
            }

            // Criar reply/comment no ticket
            DB::beginTransaction();

            $reply = Reply::create([
                'ticket_id' => $ticket->id,
                'user_id' => null, // Resposta externa (cliente)
                'content' => $content,
                'is_internal' => false,
                'external_message_id' => $messageId, // Para idempotência
                'from_email' => $fromEmail,
                'from_name' => $this->extractNameFromEmail($fromEmail, $payload),
                'via' => 'email',
            ]);

            // Processar anexos (se houver)
            $attachmentCount = (int) ($payload['attachment-count'] ?? 0);
            if ($attachmentCount > 0) {
                $this->processMailgunAttachments($ticket, $reply, $payload, $attachmentCount);
            }

            // Atualizar status do ticket se necessário
            if ($ticket->status === 'CLOSED' || $ticket->status === 'RESOLVED') {
                $ticket->update(['status' => 'IN_PROGRESS']);
            }

            DB::commit();

            Log::info('✅ Resposta direta processada via Reply-To HMAC', [
                'ticket_id' => $ticket->id,
                'reply_id' => $reply->id,
                'from' => $fromEmail,
                'from_name' => $reply->from_name,
                'message_id' => $messageId,
                'content_length' => strlen($content),
                'has_attachments' => $attachmentCount > 0,
                'timestamp' => now()->toIso8601String(),
            ]);

            // NÃO enviar notificações para evitar loops
            // O atendente verá a resposta no painel

            return [
                'action' => 'reply_added_direct',
                'ticket_id' => $ticket->id,
                'reply_id' => $reply->id,
                'tenant_id' => $ticket->tenant_id,
            ];

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Erro ao processar resposta direta', [
                'ticket_id' => $ticketId,
                'from' => $fromEmail,
                'error' => $e->getMessage(),
            ]);
            
            throw $e;
        }
    }

    /**
     * Process Mailgun attachments.
     */
    private function processMailgunAttachments(Ticket $ticket, Reply $reply, array $payload, int $count): void
    {
        for ($i = 1; $i <= $count; $i++) {
            $key = "attachment-{$i}";
            
            if (isset($payload[$key])) {
                // Mailgun envia anexos como base64 ou arquivo
                $attachment = $payload[$key];
                
                try {
                    // Se for string, é base64
                    if (is_string($attachment)) {
                        $content = base64_decode($attachment);
                        $filename = $payload["attachment-{$i}-name"] ?? "attachment-{$i}";
                        $mimeType = $payload["attachment-{$i}-type"] ?? 'application/octet-stream';
                        $size = strlen($content);
                    } else {
                        // É um arquivo (não deveria acontecer via webhook, mas suporte para testes)
                        continue;
                    }

                    // Salvar anexo
                    $uniqueFilename = time() . '_' . uniqid() . '_' . $filename;
                    $path = 'attachments/' . $uniqueFilename;
                    Storage::disk('public')->put($path, $content);

                    Attachment::create([
                        'ticket_id' => $ticket->id,
                        'reply_id' => $reply->id,
                        'user_id' => null,
                        'filename' => $uniqueFilename,
                        'original_name' => $filename,
                        'path' => $path,
                        'size' => $size,
                        'mime_type' => $mimeType,
                    ]);

                    Log::info('Anexo processado de resposta direta', [
                        'ticket_id' => $ticket->id,
                        'reply_id' => $reply->id,
                        'filename' => $filename,
                    ]);
                } catch (\Exception $e) {
                    Log::error('Erro ao processar anexo', [
                        'ticket_id' => $ticket->id,
                        'filename' => $filename ?? "attachment-{$i}",
                        'error' => $e->getMessage(),
                    ]);
                    // Continuar processando outros anexos
                }
            }
        }
    }

    /**
     * Processar e-mail recebido do Mailgun.
     *
     * @param array $payload
     * @return array
     */
    public function processInboundEmail(array $payload): array
    {
        try {
            // Extrair campos do Mailgun
            $from = $payload['sender'] ?? $payload['from'] ?? '';
            $to = $payload['recipient'] ?? $payload['to'] ?? '';
            $subject = $payload['subject'] ?? 'Sem assunto';
            $messageId = trim($payload['Message-Id'] ?? $payload['message-id'] ?? '', '<>');

            Log::info('📧 Processando e-mail recebido do Mailgun', [
                'from' => $from,
                'to' => $to,
                'subject' => $subject,
                'message_id' => $messageId,
                'timestamp' => now()->toIso8601String(),
            ]);

            // Extrair tenant_id do destinatário
            $tenantId = $this->extractTenantId($to);

            if (!$tenantId) {
                throw new \Exception('Não foi possível extrair tenant_id do destinatário: ' . $to);
            }

            // Validar se o tenant existe
            $tenant = Tenant::find($tenantId);
            if (!$tenant) {
                throw new \Exception('Tenant não encontrado: ' . $tenantId);
            }

            // Montar parsedEmail a partir dos campos do Mailgun
            $bodyPlain = $payload['body-plain'] ?? $payload['stripped-text'] ?? '';
            $bodyHtml = $payload['body-html'] ?? '';
            $strippedText = $payload['stripped-text'] ?? $bodyPlain;

            $parsedEmail = [
                'from' => $from,
                'to' => $to,
                'subject' => $subject,
                'body_plain' => $bodyPlain,
                'body_html' => $bodyHtml,
                'body_text' => $strippedText ?: $bodyPlain,
                'body' => $strippedText ?: $bodyPlain,
                'attachments' => $this->extractMailgunAttachmentsArray($payload),
            ];

            Log::info('Email parseado com sucesso', [
                'from' => $from,
                'to' => $to,
                'has_html' => !empty($bodyHtml),
                'has_plain' => !empty($bodyPlain),
                'attachments_count' => count($parsedEmail['attachments']),
            ]);

            // Verificar se é um novo ticket ou resposta
            $ticketId = $this->extractTicketId($subject);

            if ($ticketId) {
                // Verificar se o ticket existe
                $ticket = Ticket::where('id', $ticketId)
                    ->where('tenant_id', $tenant->id)
                    ->first();
                
                if ($ticket) {
                    // É uma resposta a ticket existente
                    return $this->processReply($tenant, $ticketId, $from, $parsedEmail);
                } else {
                    // Ticket não existe, criar como pré-ticket
                    Log::warning('E-mail referenciando ticket inexistente, criando pré-ticket', [
                        'ticket_id_mencionado' => $ticketId,
                        'from' => $from,
                        'subject' => $subject,
                    ]);
                    return $this->processPreTicket($tenant, $from, $subject, $parsedEmail, $to, "Ticket #$ticketId mencionado não encontrado");
                }
            } else {
                // Não tem ticket_id no assunto - criar pré-ticket para triagem
                Log::info('E-mail sem ticket ID no assunto, criando pré-ticket para triagem', [
                    'from' => $from,
                    'subject' => $subject,
                ]);
                return $this->processPreTicket($tenant, $from, $subject, $parsedEmail, $to);
            }
        } catch (\Exception $e) {
            Log::error('Erro ao processar e-mail recebido', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    /**
     * Extrair anexos do payload do Mailgun.
     *
     * @param array $payload
     * @return array
     */
    private function extractMailgunAttachmentsArray(array $payload): array
    {
        $attachments = [];
        $count = (int) ($payload['attachment-count'] ?? 0);

        for ($i = 1; $i <= $count; $i++) {
            $key = "attachment-{$i}";
            
            if (isset($payload[$key])) {
                $attachments[] = [
                    'content' => $payload[$key],
                    'filename' => $payload["attachment-{$i}-name"] ?? "attachment-{$i}",
                    'mime_type' => $payload["attachment-{$i}-type"] ?? 'application/octet-stream',
                ];
            }
        }

        return $attachments;
    }


    /**
     * Extrair nome do remetente do e-mail ou payload.
     *
     * @param string $email
     * @param array $payload
     * @return string
     */
    private function extractNameFromEmail(string $email, array $payload): string
    {
        // Tentar extrair do payload primeiro
        if (isset($payload['From']) && preg_match('/^(.+?)\s*<.+?>$/', $payload['From'], $matches)) {
            return trim($matches[1], '"');
        }
        
        if (isset($payload['from_name'])) {
            return $payload['from_name'];
        }
        
        // Fallback: usar a parte antes do @ do e-mail
        if (preg_match('/^([^@]+)@/', $email, $matches)) {
            return ucfirst(str_replace(['.', '_', '-'], ' ', $matches[1]));
        }
        
        return $email;
    }

    /**
     * Extrair tenant_id do endereço de e-mail (ex: 1234@tickets.fluxdesk.com.br).
     * Aceita ID numérico, SLUG, CNPJ ou e-mail mapeado.
     *
     * @param string $email
     * @return int|null
     */
    private function extractTenantId(string $email): ?int
    {
        $normalizedEmail = strtolower(trim($email));
        
        // 1. Buscar e-mail cadastrado no banco de dados (prioridade)
        $tenantEmail = TenantEmailAddress::where('email', $normalizedEmail)
            ->where('active', true)
            ->incoming()
            ->first();
        
        if ($tenantEmail) {
            Log::info('E-mail encontrado no banco de dados', [
                'email' => $email,
                'tenant_id' => $tenantEmail->tenant_id,
                'purpose' => $tenantEmail->purpose,
                'priority' => $tenantEmail->priority,
            ]);
            return $tenantEmail->tenant_id;
        }
        
        // 2. Fallback: Verificar mapeamento estático no config (legado)
        $emailMapping = config('mail.tenant_email_mapping', []);
        
        if (isset($emailMapping[$normalizedEmail])) {
            $mappedTenantSlug = $emailMapping[$normalizedEmail];
            
            Log::info('E-mail mapeado encontrado no config (legado)', [
                'email' => $email,
                'mapped_slug' => $mappedTenantSlug,
            ]);
            
            // Buscar tenant pelo SLUG mapeado
            $tenant = Tenant::where('slug', $mappedTenantSlug)->first();
            
            if ($tenant) {
                Log::info('Tenant identificado via mapeamento legado', [
                    'email' => $email,
                    'tenant_id' => $tenant->id,
                    'tenant_slug' => $tenant->slug,
                ]);
                return $tenant->id;
            }
        }
        
        // 3. Extrair a parte antes do @ (pode ser: slug, ID ou CNPJ)
        if (preg_match('/^([a-zA-Z0-9_-]+)@/', $email, $matches)) {
            $identifier = $matches[1];
            
            // Prioridade 1: Buscar tenant por SLUG ou CNPJ primeiro
            $tenant = Tenant::where('slug', $identifier)
                ->orWhere('cnpj', $identifier)
                ->first();
            
            if ($tenant) {
                Log::info('Tenant identificado por SLUG/CNPJ', [
                    'identifier' => $identifier,
                    'tenant_id' => $tenant->id,
                    'tenant_slug' => $tenant->slug,
                ]);
                return $tenant->id;
            }
            
            // Prioridade 2: Se não encontrou e for apenas números, tentar por ID
            if (ctype_digit($identifier) && strlen($identifier) <= 10) {
                Log::info('Tenant identificado por ID numérico (fallback)', [
                    'identifier' => $identifier,
                    'email' => $email,
                ]);
                return (int) $identifier;
            }
            
            Log::warning('Tenant não encontrado em nenhum método', [
                'identifier' => $identifier,
                'email' => $email,
            ]);
        }

        return null;
    }

    /**
     * Extrair ticket ID do assunto (ex: [TKT-1234] ou Re: [TKT-1234]).
     *
     * @param string $subject
     * @return int|null
     */
    private function extractTicketId(string $subject): ?int
    {
        // Procurar padrão [TKT-XXXX]
        if (preg_match('/\[TKT-(\d+)\]/', $subject, $matches)) {
            return (int) $matches[1];
        }

        return null;
    }


    /**
     * Processar novo ticket a partir do e-mail.
     *
     * @param Tenant $tenant
     * @param string $from
     * @param string $subject
     * @param array $parsedEmail
     * @param string $toEmail
     * @return array
     */
    private function processNewTicket(Tenant $tenant, string $from, string $subject, array $parsedEmail, string $toEmail): array
    {
        DB::beginTransaction();

        try {
            // Buscar configuração do e-mail de recebimento
            $tenantEmail = TenantEmailAddress::where('tenant_id', $tenant->id)
                ->where('email', strtolower($toEmail))
                ->where('active', true)
                ->first();

            // Encontrar ou criar contato
            $contact = $this->findOrCreateContact($tenant->id, $from, $parsedEmail['from_name'] ?? null);

            // Determinar cliente
            $clientId = null;
            if ($tenantEmail && $tenantEmail->client_filter) {
                $clientId = $tenantEmail->client_filter;
            } else {
                // Fallback: primeiro cliente do tenant
                $client = Client::where('tenant_id', $tenant->id)->first();
                if (!$client) {
                    throw new \Exception('Nenhum cliente encontrado para o tenant: ' . $tenant->id);
                }
                $clientId = $client->id;
            }

            // Determinar serviço e prioridade
            if ($tenantEmail && $tenantEmail->service_id && $tenantEmail->priority_id) {
                $serviceId = $tenantEmail->service_id;
                $priorityId = $tenantEmail->priority_id;
                
                Log::info('Usando serviço e prioridade do e-mail configurado', [
                    'email' => $toEmail,
                    'service_id' => $serviceId,
                    'priority_id' => $priorityId,
                ]);
            } else {
                // Fallback: primeiro serviço do tenant
                $service = Service::where('tenant_id', $tenant->id)->first();
                
                if (!$service) {
                    throw new \Exception('Nenhum serviço encontrado para o tenant: ' . $tenant->id);
                }
                
                $serviceId = $service->id;
                
                // Primeira prioridade do serviço
                $priority = \App\Models\Priority::where('service_id', $serviceId)->first();
                $priorityId = $priority ? $priority->id : null;
                
                Log::warning('E-mail não configurado ou incompleto, usando serviço/prioridade padrão', [
                    'email' => $toEmail,
                    'service_id' => $serviceId,
                    'priority_id' => $priorityId,
                ]);
            }

            // Buscar ticket_type_id do serviço
            $service = Service::find($serviceId);
            
            // Obter usuário padrão do tenant para tickets via e-mail
            $defaultUser = User::where('tenant_id', $tenant->id)
                ->orderBy('id')
                ->first();

            if (!$defaultUser) {
                throw new \Exception('Nenhum usuário encontrado para o tenant: ' . $tenant->id . '. É necessário ter pelo menos um usuário cadastrado.');
            }

            // Criar ticket
            $ticket = Ticket::create([
                'tenant_id' => $tenant->id,
                'client_id' => $clientId,
                'contact_id' => $contact->id,
                'user_id' => $defaultUser->id,
                'service_id' => $serviceId,
                'priority_id' => $priorityId,
                'ticket_type_id' => $service->ticket_type_id,
                'title' => $subject,
                'description' => $parsedEmail['body_html'] ?? $parsedEmail['body_text'] ?? '',
                'status' => 'OPEN',
                'stage' => 'PENDENTE',
            ]);

            // Processar anexos
            if (!empty($parsedEmail['attachments'])) {
                $this->processAttachments($ticket, null, $parsedEmail['attachments']);
            }

            DB::commit();

            // Enviar notificação de ticket criado
            $this->sendTicketCreatedNotification($ticket);

            Log::info('✅ Ticket criado a partir de e-mail', [
                'ticket_id' => $ticket->id,
                'tenant_id' => $tenant->id,
                'client_id' => $clientId,
                'contact_id' => $contact->id,
                'contact_email' => $from,
                'service_id' => $serviceId,
                'priority_id' => $priorityId,
                'has_attachments' => !empty($parsedEmail['attachments']),
                'timestamp' => now()->toIso8601String(),
            ]);

            return [
                'action' => 'ticket_created',
                'ticket_id' => $ticket->id,
                'tenant_id' => $tenant->id,
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Processar e-mail como pré-ticket (aguardando triagem manual).
     *
     * @param Tenant $tenant
     * @param string $from
     * @param string $subject
     * @param array $parsedEmail
     * @param string $toEmail
     * @param string|null $reason
     * @return array
     */
    private function processPreTicket(Tenant $tenant, string $from, string $subject, array $parsedEmail, string $toEmail, ?string $reason = null): array
    {
        DB::beginTransaction();

        try {
            // Buscar configuração do e-mail de recebimento
            $tenantEmail = TenantEmailAddress::where('tenant_id', $tenant->id)
                ->where('email', strtolower($toEmail))
                ->where('active', true)
                ->first();

            // Encontrar ou criar contato
            $contact = $this->findOrCreateContact($tenant->id, $from, $parsedEmail['from_name'] ?? null);

            // Determinar cliente
            $clientId = null;
            if ($tenantEmail && $tenantEmail->client_filter) {
                $clientId = $tenantEmail->client_filter;
            } else {
                // Fallback: primeiro cliente do tenant
                $client = Client::where('tenant_id', $tenant->id)->first();
                if (!$client) {
                    throw new \Exception('Nenhum cliente encontrado para o tenant: ' . $tenant->id);
                }
                $clientId = $client->id;
            }

            // Determinar serviço e prioridade (usar padrões ou do e-mail configurado)
            if ($tenantEmail && $tenantEmail->service_id && $tenantEmail->priority_id) {
                $serviceId = $tenantEmail->service_id;
                $priorityId = $tenantEmail->priority_id;
            } else {
                // Fallback: primeiro serviço do tenant
                $service = Service::where('tenant_id', $tenant->id)->first();
                
                if (!$service) {
                    throw new \Exception('Nenhum serviço encontrado para o tenant: ' . $tenant->id);
                }
                
                $serviceId = $service->id;
                $priority = \App\Models\Priority::where('service_id', $serviceId)->first();
                $priorityId = $priority ? $priority->id : null;
            }

            // Buscar ticket_type_id do serviço
            $service = Service::find($serviceId);
            
            // Obter usuário padrão do tenant
            $defaultUser = User::where('tenant_id', $tenant->id)
                ->orderBy('id')
                ->first();

            if (!$defaultUser) {
                throw new \Exception('Nenhum usuário encontrado para o tenant: ' . $tenant->id);
            }

            // Adicionar informação sobre o motivo no título se houver
            $title = $reason 
                ? "🔍 [Triagem] " . $subject . " - " . $reason
                : "🔍 [Triagem] " . $subject;

            // Adicionar contexto na descrição
            $description = $parsedEmail['body_html'] ?? $parsedEmail['body_text'] ?? '';
            $description = "<div class='bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4'>"
                . "<p class='font-semibold text-yellow-800'>⚠️ Pré-Ticket - Aguardando Triagem</p>"
                . "<p class='text-sm text-yellow-700 mt-1'>Este ticket foi criado automaticamente a partir de um e-mail recebido em <strong>$toEmail</strong>.</p>"
                . "<p class='text-sm text-yellow-700'>Remetente: <strong>$from</strong></p>"
                . ($reason ? "<p class='text-sm text-yellow-700'>Motivo: <strong>$reason</strong></p>" : "")
                . "<p class='text-sm text-yellow-700 mt-2'>Por favor, revise e classifique este ticket antes de iniciar o atendimento.</p>"
                . "</div>"
                . $description;

            // Criar pré-ticket
            $ticket = Ticket::create([
                'tenant_id' => $tenant->id,
                'client_id' => $clientId,
                'contact_id' => $contact->id,
                'user_id' => $defaultUser->id,
                'service_id' => $serviceId,
                'priority_id' => $priorityId,
                'ticket_type_id' => $service->ticket_type_id,
                'title' => $title,
                'description' => $description,
                'status' => 'PRE_TICKET', // Status especial para pré-tickets
                'stage' => 'PENDENTE',
            ]);

            // Processar anexos
            if (!empty($parsedEmail['attachments'])) {
                $this->processAttachments($ticket, null, $parsedEmail['attachments']);
            }

            DB::commit();

            // NÃO enviar notificação para pré-tickets (evitar spam)
            // Apenas logar para auditoria

            Log::info('🔍 Pré-ticket criado a partir de e-mail (aguardando triagem)', [
                'ticket_id' => $ticket->id,
                'tenant_id' => $tenant->id,
                'client_id' => $clientId,
                'contact_id' => $contact->id,
                'contact_email' => $from,
                'contact_name' => $contact->name,
                'service_id' => $serviceId,
                'priority_id' => $priorityId,
                'reason' => $reason,
                'has_attachments' => !empty($parsedEmail['attachments']),
                'timestamp' => now()->toIso8601String(),
            ]);

            return [
                'action' => 'pre_ticket_created',
                'ticket_id' => $ticket->id,
                'tenant_id' => $tenant->id,
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Erro ao criar pré-ticket', [
                'from' => $from,
                'subject' => $subject,
                'error' => $e->getMessage(),
            ]);
            
            throw $e;
        }
    }

    /**
     * Processar resposta a ticket existente.
     *
     * @param Tenant $tenant
     * @param int $ticketId
     * @param string $from
     * @param array $parsedEmail
     * @return array
     */
    private function processReply(Tenant $tenant, int $ticketId, string $from, array $parsedEmail): array
    {
        DB::beginTransaction();

        try {
            // Buscar ticket
            $ticket = Ticket::where('id', $ticketId)
                ->where('tenant_id', $tenant->id)
                ->first();

            if (!$ticket) {
                throw new \Exception('Ticket não encontrado: ' . $ticketId . ' no tenant: ' . $tenant->id);
            }

            // Encontrar ou criar contato
            $contact = $this->findOrCreateContact($tenant->id, $from, $parsedEmail['from_name'] ?? null);

            // Criar resposta
            $reply = Reply::create([
                'ticket_id' => $ticket->id,
                'user_id' => null, // E-mail não tem usuário logado
                'content' => $parsedEmail['body_html'] ?? $parsedEmail['body_text'] ?? '',
                'is_internal' => false, // Resposta de cliente é sempre pública
                'from_email' => $from,
                'from_name' => $contact->name ?? $this->extractNameFromEmail($from, $parsedEmail),
                'via' => 'email',
            ]);

            // Processar anexos
            if (!empty($parsedEmail['attachments'])) {
                $this->processAttachments($ticket, $reply, $parsedEmail['attachments']);
            }

            // Atualizar ticket para IN_PROGRESS se estava OPEN
            if ($ticket->status === 'OPEN') {
                $ticket->update(['status' => 'IN_PROGRESS']);
            }

            DB::commit();

            // Enviar notificação de nova resposta
            $this->sendReplyNotification($ticket, $reply);

            Log::info('✅ Resposta adicionada a ticket via e-mail', [
                'ticket_id' => $ticket->id,
                'reply_id' => $reply->id,
                'contact_id' => $contact->id,
                'contact_email' => $from,
                'contact_name' => $contact->name,
                'content_length' => strlen($reply->content),
                'has_attachments' => !empty($parsedEmail['attachments']),
                'old_status' => $ticket->getOriginal('status'),
                'new_status' => $ticket->status,
                'timestamp' => now()->toIso8601String(),
            ]);

            return [
                'action' => 'reply_added',
                'ticket_id' => $ticket->id,
                'reply_id' => $reply->id,
                'tenant_id' => $tenant->id,
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Encontrar ou criar contato baseado no e-mail.
     *
     * @param int $tenantId
     * @param string $email
     * @param string|null $name
     * @return Contact
     */
    private function findOrCreateContact(int $tenantId, string $email, ?string $name = null): Contact
    {
        // Buscar contato existente
        $contact = Contact::where('tenant_id', $tenantId)
            ->where('email', $email)
            ->first();

        if ($contact) {
            return $contact;
        }

        // Criar novo contato
        // Obter primeiro cliente do tenant como padrão
        $client = Client::where('tenant_id', $tenantId)->first();

        if (!$client) {
            throw new \Exception('Nenhum cliente encontrado para criar contato no tenant: ' . $tenantId);
        }

        $contact = Contact::create([
            'tenant_id' => $tenantId,
            'client_id' => $client->id,
            'name' => $name ?? $email, // Se não tiver nome, usar e-mail
            'email' => $email,
            'contact_type' => 'Cliente',
            'portal_access' => false,
        ]);

        Log::info('Novo contato criado a partir de e-mail', [
            'contact_id' => $contact->id,
            'email' => $email,
            'tenant_id' => $tenantId,
        ]);

        return $contact;
    }

    /**
     * Processar e salvar anexos do e-mail.
     *
     * @param Ticket $ticket
     * @param Reply|null $reply
     * @param array $attachments
     * @return void
     */
    private function processAttachments(Ticket $ticket, ?Reply $reply, array $attachments): void
    {
        foreach ($attachments as $attachment) {
            try {
                // Decodificar conteúdo base64
                $content = base64_decode($attachment['content'] ?? '');
                $filename = $attachment['filename'] ?? 'attachment-' . uniqid();
                $mimeType = $attachment['mime_type'] ?? 'application/octet-stream';
                $size = strlen($content);

                // Gerar nome único para o arquivo
                $uniqueFilename = time() . '_' . uniqid() . '_' . $filename;

                // Salvar no storage
                $path = 'attachments/' . $uniqueFilename;
                Storage::disk('public')->put($path, $content);

                // Criar registro de anexo
                Attachment::create([
                    'ticket_id' => $ticket->id,
                    'reply_id' => $reply?->id,
                    'user_id' => null,
                    'filename' => $uniqueFilename,
                    'original_name' => $filename,
                    'path' => $path,
                    'size' => $size,
                    'mime_type' => $mimeType,
                ]);

                Log::info('Anexo salvo de e-mail', [
                    'ticket_id' => $ticket->id,
                    'filename' => $filename,
                    'size' => $size,
                ]);
            } catch (\Exception $e) {
                Log::error('Erro ao processar anexo do e-mail', [
                    'ticket_id' => $ticket->id,
                    'filename' => $attachment['filename'] ?? 'unknown',
                    'error' => $e->getMessage(),
                ]);
                // Continuar processando outros anexos
            }
        }
    }

    /**
     * Enviar notificação de ticket criado.
     *
     * @param Ticket $ticket
     * @return void
     */
    private function sendTicketCreatedNotification(Ticket $ticket): void
    {
        try {
            // Notificar o contato (solicitante)
            if ($ticket->contact && $ticket->contact->email) {
                Log::info('Tentando enviar notificação de ticket criado', [
                    'ticket_id' => $ticket->id,
                    'to_email' => $ticket->contact->email,
                ]);
                
                Mail::to($ticket->contact->email)->queue(
                    new TicketCreatedNotification($ticket)
                );
                
                Log::info('Notificação de ticket criado enfileirada', [
                    'ticket_id' => $ticket->id,
                ]);
            } else {
                Log::warning('Ticket criado mas sem e-mail de contato para notificar', [
                    'ticket_id' => $ticket->id,
                    'contact_id' => $ticket->contact_id ?? null,
                ]);
            }

            // TODO: Notificar grupos de atendentes responsáveis pelo serviço
        } catch (\Exception $e) {
            // Logar erro mas NÃO propagar exceção
            // O ticket já foi criado, a falha na notificação não deve impedir isso
            Log::error('Erro ao enviar notificação de ticket criado', [
                'ticket_id' => $ticket->id,
                'contact_email' => $ticket->contact->email ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }

    /**
     * Enviar notificação de nova resposta.
     *
     * @param Ticket $ticket
     * @param Reply $reply
     * @return void
     */
    private function sendReplyNotification(Ticket $ticket, Reply $reply): void
    {
        try {
            // Notificar o responsável pelo ticket (se houver)
            if ($ticket->assignee && $ticket->assignee->email) {
                Log::info('Tentando enviar notificação de resposta', [
                    'ticket_id' => $ticket->id,
                    'reply_id' => $reply->id,
                    'to_email' => $ticket->assignee->email,
                ]);
                
                Mail::to($ticket->assignee->email)->queue(
                    new TicketReplyNotification($ticket, $reply)
                );
                
                Log::info('Notificação de resposta enfileirada', [
                    'ticket_id' => $ticket->id,
                    'reply_id' => $reply->id,
                ]);
            } else {
                Log::warning('Resposta criada mas sem responsável para notificar', [
                    'ticket_id' => $ticket->id,
                    'reply_id' => $reply->id,
                    'user_id' => $ticket->user_id ?? null,
                ]);
            }

            // TODO: Notificar outros participantes do ticket
        } catch (\Exception $e) {
            // Logar erro mas NÃO propagar exceção
            // A resposta já foi criada, a falha na notificação não deve impedir isso
            Log::error('Erro ao enviar notificação de resposta', [
                'ticket_id' => $ticket->id,
                'reply_id' => $reply->id,
                'assignee_email' => $ticket->assignee->email ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }
}
