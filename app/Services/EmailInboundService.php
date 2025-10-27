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
            $to = $mail['destination'][0] ?? ''; // Primeiro destinatário
            $subject = $commonHeaders['subject'] ?? 'Sem assunto';
            $messageId = $mail['messageId'] ?? '';

            // Log inicial
            Log::info('Processando e-mail recebido', [
                'from' => $from,
                'to' => $to,
                'subject' => $subject,
                'message_id' => $messageId,
            ]);

            // Extrair tenant_id do destinatário (ex: 1234@tickets.fluxdesk.com.br)
            $tenantId = $this->extractTenantId($to);

            if (!$tenantId) {
                throw new \Exception('Não foi possível extrair tenant_id do destinatário: ' . $to);
            }

            // Validar se o tenant existe
            $tenant = Tenant::find($tenantId);
            if (!$tenant) {
                throw new \Exception('Tenant não encontrado: ' . $tenantId);
            }

            // Baixar conteúdo completo do e-mail do S3 (se configurado)
            $emailContent = $this->fetchEmailFromS3($messageContent);

            // Parsear o e-mail
            $parsedEmail = EmailParser::parse($emailContent);

            // Verificar se é um novo ticket ou resposta
            $ticketId = $this->extractTicketId($subject);

            if ($ticketId) {
                // É uma resposta a ticket existente
                return $this->processReply($tenant, $ticketId, $from, $parsedEmail);
            } else {
                // É um novo ticket
                return $this->processNewTicket($tenant, $from, $subject, $parsedEmail);
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
     * Extrair tenant_id do endereço de e-mail (ex: 1234@tickets.fluxdesk.com.br).
     * Aceita ID numérico, SLUG ou CNPJ.
     *
     * @param string $email
     * @return int|null
     */
    private function extractTenantId(string $email): ?int
    {
        // Extrair a parte antes do @ (pode ser: ID, slug, ou CNPJ)
        if (preg_match('/^([a-zA-Z0-9_-]+)@/', $email, $matches)) {
            $identifier = $matches[1];
            
            // Se for apenas números pequenos (ID), usar diretamente
            if (ctype_digit($identifier) && strlen($identifier) <= 10) {
                return (int) $identifier;
            }
            
            // Buscar tenant por: slug ou CNPJ
            $tenant = Tenant::where('slug', $identifier)
                ->orWhere('cnpj', $identifier)
                ->first();
            
            if ($tenant) {
                Log::info('Tenant identificado', [
                    'identifier' => $identifier,
                    'tenant_id' => $tenant->id,
                    'tenant_slug' => $tenant->slug,
                ]);
                return $tenant->id;
            }
            
            Log::warning('Tenant não encontrado', [
                'identifier' => $identifier,
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
     * @return array
     */
    private function processNewTicket(Tenant $tenant, string $from, string $subject, array $parsedEmail): array
    {
        DB::beginTransaction();

        try {
            // Encontrar ou criar contato
            $contact = $this->findOrCreateContact($tenant->id, $from, $parsedEmail['from_name'] ?? null);

            // Obter o primeiro cliente do tenant (ou usar um padrão)
            // TODO: Melhorar lógica para associar ao cliente correto
            $client = Client::where('tenant_id', $tenant->id)->first();

            if (!$client) {
                throw new \Exception('Nenhum cliente encontrado para o tenant: ' . $tenant->id);
            }

            // Obter serviço padrão (primeiro serviço do tenant)
            // TODO: Permitir configurar serviço padrão por tenant
            $service = Service::where('tenant_id', $tenant->id)->first();

            if (!$service) {
                throw new \Exception('Nenhum serviço encontrado para o tenant: ' . $tenant->id);
            }

            // Criar ticket
            $ticket = Ticket::create([
                'tenant_id' => $tenant->id,
                'client_id' => $client->id,
                'contact_id' => $contact->id,
                'user_id' => null, // E-mail não tem usuário logado
                'service_id' => $service->id,
                'ticket_type_id' => $service->ticket_type_id,
                'title' => $subject,
                'description' => $parsedEmail['body_html'] ?? $parsedEmail['body_text'] ?? '',
                'status' => 'OPEN',
                'stage' => 'PENDENTE',
                'priority' => 'MEDIUM',
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
                Mail::to($ticket->contact->email)->queue(
                    new TicketCreatedNotification($ticket)
                );
            }

            // TODO: Notificar grupos de atendentes responsáveis pelo serviço
        } catch (\Exception $e) {
            Log::error('Erro ao enviar notificação de ticket criado', [
                'ticket_id' => $ticket->id,
                'error' => $e->getMessage(),
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
                Mail::to($ticket->assignee->email)->queue(
                    new TicketReplyNotification($ticket, $reply)
                );
            }

            // TODO: Notificar outros participantes do ticket
        } catch (\Exception $e) {
            Log::error('Erro ao enviar notificação de resposta', [
                'ticket_id' => $ticket->id,
                'reply_id' => $reply->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
