<?php

namespace App\Services;

use App\Helpers\EmailParser;
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
     * Processar e-mail recebido do SES.
     *
     * @param array $messageContent
     * @return array
     */
    public function processInboundEmail(array $messageContent): array
    {
        try {
            // Extrair informações do e-mail
            $mail = $messageContent['mail'] ?? [];
            $commonHeaders = $mail['commonHeaders'] ?? [];

            $from = $mail['source'] ?? '';
            $destinations = $mail['destination'] ?? [];
            $subject = $commonHeaders['subject'] ?? 'Sem assunto';
            $messageId = $mail['messageId'] ?? '';

            // Log inicial com TODOS os destinatários
            Log::info('Processando e-mail recebido', [
                'from' => $from,
                'destinations' => $destinations,
                'subject' => $subject,
                'message_id' => $messageId,
                'headers' => $commonHeaders,
            ]);

            // Encontrar o destinatário correto (prioritizar @tickets.fluxdesk.com.br)
            // Busca em: destinations, headers To, X-Original-To, etc
            $to = $this->findTicketEmailAddress($destinations, $commonHeaders);

            // Extrair tenant_id do destinatário (ex: 1234@tickets.fluxdesk.com.br)
            $tenantId = $this->extractTenantId($to);

            if (!$tenantId) {
                throw new \Exception('Não foi possível extrair tenant_id do destinatário: ' . $to . ' (todos destinatários: ' . implode(', ', $destinations) . ')');
            }

            // Validar se o tenant existe
            $tenant = Tenant::find($tenantId);
            if (!$tenant) {
                throw new \Exception('Tenant não encontrado: ' . $tenantId);
            }

            // Verificar se o conteúdo já está no payload (Mailgun) ou precisa buscar do S3 (SES)
            if (isset($messageContent['content'])) {
                // Payload do Mailgun com conteúdo inline
                $parsedEmail = [
                    'from' => $from,
                    'to' => $to,
                    'subject' => $subject,
                    'body_plain' => $messageContent['content']['plain'] ?? '',
                    'body_html' => $messageContent['content']['html'] ?? '',
                    'body' => $messageContent['content']['stripped_text'] ?? $messageContent['content']['plain'] ?? '',
                    'attachments' => $messageContent['attachments'] ?? [],
                ];
            } else {
                // Payload do SES - baixar conteúdo completo do S3 (se configurado)
                $emailContent = $this->fetchEmailFromS3($messageContent);
                
                // Parsear o e-mail
                $parsedEmail = EmailParser::parse($emailContent);
            }

            // Usar o endereço do remetente extraído do e-mail parseado (From: header)
            // em vez do mail.source que pode ser um endereço de bounce/envelope
            $senderEmail = $parsedEmail['from'] ?? $from;
            
            Log::info('Remetente identificado', [
                'envelope_source' => $from,
                'parsed_from' => $parsedEmail['from'] ?? null,
                'using' => $senderEmail,
            ]);

            // Verificar se é um novo ticket ou resposta
            $ticketId = $this->extractTicketId($subject);

            if ($ticketId) {
                // É uma resposta a ticket existente
                return $this->processReply($tenant, $ticketId, $senderEmail, $parsedEmail);
            } else {
                // É um novo ticket
                return $this->processNewTicket($tenant, $senderEmail, $subject, $parsedEmail, $to);
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
     * Encontrar o endereço de e-mail correto do sistema de tickets.
     * Procura por e-mails que terminam com o domínio configurado (ex: @tickets.fluxdesk.com.br).
     * Útil para e-mails encaminhados onde há múltiplos destinatários.
     *
     * @param array $destinations Lista de destinatários do e-mail
     * @param array $headers Headers do e-mail
     * @return string
     */
    private function findTicketEmailAddress(array $destinations, array $headers = []): string
    {
        // Domínio do sistema de tickets (pode ser configurado no .env)
        $ticketDomain = config('mail.ticket_domain', 'tickets.fluxdesk.com.br');

        // 1. Procurar nos destinatários SES
        if (!empty($destinations)) {
            foreach ($destinations as $destination) {
                if (str_ends_with(strtolower($destination), '@' . strtolower($ticketDomain))) {
                    Log::info('E-mail do sistema encontrado nos destinations', [
                        'ticket_email' => $destination,
                        'all_destinations' => $destinations,
                    ]);
                    return $destination;
                }
            }
        }

        // 2. Procurar no header 'To' original
        if (isset($headers['to']) && is_array($headers['to'])) {
            foreach ($headers['to'] as $toAddress) {
                if (str_ends_with(strtolower($toAddress), '@' . strtolower($ticketDomain))) {
                    Log::info('E-mail do sistema encontrado no header To', [
                        'ticket_email' => $toAddress,
                        'header_to' => $headers['to'],
                    ]);
                    return $toAddress;
                }
            }
        }

        // 3. Procurar no header 'To' como string
        if (isset($headers['to']) && is_string($headers['to'])) {
            // Pode vir como: "Nome <email@domain.com>, Outro <outro@domain.com>"
            if (preg_match_all('/<([^>]+@' . preg_quote($ticketDomain, '/') . ')>/i', $headers['to'], $matches)) {
                $foundEmail = $matches[1][0];
                Log::info('E-mail do sistema encontrado no header To (string)', [
                    'ticket_email' => $foundEmail,
                    'header_to' => $headers['to'],
                ]);
                return $foundEmail;
            }
            
            // Ou pode vir direto: "email@domain.com"
            if (str_ends_with(strtolower($headers['to']), '@' . strtolower($ticketDomain))) {
                Log::info('E-mail do sistema encontrado no header To (direto)', [
                    'ticket_email' => $headers['to'],
                ]);
                return $headers['to'];
            }
        }

        // 4. Fallback: retornar o primeiro destinatário
        $firstDestination = $destinations[0] ?? '';
        
        Log::warning('E-mail do sistema não encontrado em nenhum campo', [
            'first_destination' => $firstDestination,
            'all_destinations' => $destinations,
            'headers_to' => $headers['to'] ?? null,
            'expected_domain' => $ticketDomain,
        ]);
        
        return $firstDestination;
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
     * Buscar conteúdo completo do e-mail no S3.
     *
     * @param array $messageContent
     * @return string
     */
    private function fetchEmailFromS3(array $messageContent): string
    {
        // Se o SES está configurado para salvar no S3
        $receipt = $messageContent['receipt'] ?? [];
        $action = $receipt['action'] ?? [];

        if (isset($action['type']) && $action['type'] === 'S3' && isset($action['objectKey'])) {
            $bucket = $action['bucketName'] ?? config('services.ses.s3_bucket');
            $key = $action['objectKey'];

            try {
                // Usar o disco S3 do Laravel
                return Storage::disk('s3')->get($key);
            } catch (\Exception $e) {
                Log::warning('Erro ao buscar e-mail do S3, usando conteúdo parcial', [
                    'bucket' => $bucket,
                    'key' => $key,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // Fallback: retornar o conteúdo disponível na notificação
        $mail = $messageContent['mail'] ?? [];
        $commonHeaders = $mail['commonHeaders'] ?? [];

        return json_encode([
            'from' => $mail['source'] ?? '',
            'to' => $mail['destination'] ?? [],
            'subject' => $commonHeaders['subject'] ?? '',
            'date' => $commonHeaders['date'] ?? '',
            'messageId' => $mail['messageId'] ?? '',
        ]);
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

            Log::info('Ticket criado a partir de e-mail', [
                'ticket_id' => $ticket->id,
                'tenant_id' => $tenant->id,
                'contact_email' => $from,
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

            Log::info('Resposta adicionada a ticket via e-mail', [
                'ticket_id' => $ticket->id,
                'reply_id' => $reply->id,
                'contact_email' => $from,
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
