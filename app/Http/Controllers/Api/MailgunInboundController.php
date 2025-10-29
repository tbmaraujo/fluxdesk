<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\EmailIngestJob;
use App\Models\TicketNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class MailgunInboundController extends Controller
{
    /**
     * Webhook para receber e-mails do Mailgun Routes.
     * 
     * Suporta 4 métodos de identificação (em ordem de prioridade):
     * 0. Novo ticket (local-part@tickets.fluxdesk.com.br)
     * 1. Reply-To com HMAC (reply+tkt.{slug}.{id}.{hmac}@domain)
     * 2. Threading headers (In-Reply-To/References)
     * 3. Subject com [TKT-ID]
     */
    public function handleInbound(Request $request): JsonResponse
    {
        try {
            $recipient = $request->input('recipient', '');
            $subject = $request->input('subject', 'Sem assunto');

            Log::info('Mailgun inbound recebido', [
                'recipient' => $recipient,
                'from' => $request->input('sender'),
                'subject' => $subject,
                'to' => $request->input('to'),
            ]);

            // 0. Tentativa: Novo ticket por local-part@tickets.fluxdesk.com.br
            $tenant = $this->extractTenantFromRecipient($request);
            if ($tenant) {
                Log::info('Tenant identificado para criação de novo ticket', [
                    'tenant_id' => $tenant->id,
                    'tenant_slug' => $tenant->slug,
                    'recipient' => $recipient,
                ]);
                
                return $this->queueNewTicket($tenant, $request);
            }

            // 1. Tentativa: Reply-To com HMAC
            if (preg_match('/^reply\+tkt\.([a-z0-9-]+)\.(\d+)\.([a-f0-9]+)@/i', $recipient, $matches)) {
                [$all, $slug, $ticketId, $hmac] = $matches;
                
                // Validar HMAC
                $secret = config('services.reply.hmac_secret');
                $calculatedHmac = substr(hash_hmac('sha256', "{$slug}|{$ticketId}", $secret), 10, strlen($hmac));
                
                if (hash_equals($calculatedHmac, $hmac)) {
                    Log::info('Ticket identificado por Reply-To HMAC', [
                        'ticket_id' => $ticketId,
                        'tenant_slug' => $slug,
                    ]);
                    
                    return $this->queueAppend((int) $ticketId, $slug, $request);
                }
                
                Log::warning('HMAC inválido no Reply-To', [
                    'recipient' => $recipient,
                    'expected_prefix' => substr($calculatedHmac, 0, 4),
                ]);
            }

            // 2. Tentativa: Threading headers fallback
            $inReplyTo = $request->input('In-Reply-To') ?: $request->input('in-reply-to', '');
            $references = $request->input('References') ?: $request->input('references', '');
            
            if ($notification = TicketNotification::matchByThreading($inReplyTo, $references)) {
                Log::info('Ticket identificado por threading headers', [
                    'ticket_id' => $notification->ticket_id,
                    'tenant_slug' => $notification->tenant_slug,
                ]);
                
                return $this->queueAppend($notification->ticket_id, $notification->tenant_slug, $request);
            }

            // 3. Tentativa: Subject fallback [TKT-ID]
            if (preg_match('/\[(?:TKT|TICKET)-(\d+)\]/i', $subject, $subjectMatches)) {
                $ticketId = (int) $subjectMatches[1];
                
                Log::info('Ticket identificado por subject', [
                    'ticket_id' => $ticketId,
                    'subject' => $subject,
                ]);
                
                return $this->queueAppend($ticketId, null, $request);
            }

            // Nenhum método funcionou
            Log::warning('Inbound sem mapeamento de ticket', [
                'recipient' => $recipient,
                'subject' => $subject,
                'from' => $request->input('sender'),
            ]);
            
            return response()->json(['status' => 'ignored', 'reason' => 'no_ticket_match'], 200);

        } catch (\Throwable $e) {
            Log::error('Erro ao processar webhook Mailgun', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'error' => 'Internal server error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Queue reply/comment append to ticket.
     * Implements idempotency via Message-ID cache.
     */
    protected function queueAppend(int $ticketId, ?string $tenantSlug, Request $request): JsonResponse
    {
        // Obter Message-ID (idempotência)
        $messageId = $request->input('Message-Id') ?: $request->input('message-id', '');
        
        if (empty($messageId)) {
            // Gerar ID baseado em hash se não houver Message-ID
            $messageId = 'no-msgid:' . sha1(
                $request->input('sender', '') . '|' .
                $request->input('timestamp', '') . '|' .
                substr($request->input('body-plain', ''), 0, 200)
            );
        }

        $messageId = trim($messageId, '<>');
        $cacheKey = 'mg:msg:' . sha1($messageId);

        // Idempotência: verificar se já processamos este Message-ID
        if (!Cache::add($cacheKey, true, now()->addHours(48))) {
            Log::info('E-mail duplicado (idempotência)', [
                'message_id' => $messageId,
                'ticket_id' => $ticketId,
            ]);
            
            return response()->json(['status' => 'duplicate', 'message_id' => $messageId], 200);
        }

        // Despachar job assíncrono
        EmailIngestJob::dispatch(
            messageId: $messageId,
            from: $request->input('sender', ''),
            subject: $request->input('subject', ''),
            to: $request->input('recipient'),
            s3ObjectKey: null,
            rawPayload: $request->all(),
            ticketId: $ticketId,
            tenantSlug: $tenantSlug
        );

        Log::info('Resposta de e-mail enfileirada para processamento', [
            'ticket_id' => $ticketId,
            'tenant_slug' => $tenantSlug,
            'message_id' => $messageId,
        ]);

        return response()->json([
            'ok' => true,
            'ticket_id' => $ticketId,
            'message_id' => $messageId,
        ], 200);
    }

    /**
     * Extrai e identifica o tenant a partir do recipient.
     * 
     * Suporta:
     * - slug@tickets.fluxdesk.com.br
     * - email_code@tickets.fluxdesk.com.br
     * - id_numerico@tickets.fluxdesk.com.br (ex: 42262851012132@...)
     * 
     * @return \App\Models\Tenant|null
     */
    protected function extractTenantFromRecipient(Request $request): ?\App\Models\Tenant
    {
        // Tentar extrair recipient de múltiplas fontes
        $rcpt = (string) $request->input('recipient', '');
        $to = (string) $request->input('to', '');
        $toHdr = '';

        // Tentar extrair do message-headers (formato JSON array de pares)
        if (empty($to) && $request->filled('message-headers')) {
            $headersRaw = $request->input('message-headers');
            $headers = is_string($headersRaw) ? json_decode($headersRaw, true) : $headersRaw;
            
            if (is_array($headers) && json_last_error() === JSON_ERROR_NONE) {
                foreach ($headers as $pair) {
                    if (is_array($pair) && count($pair) === 2 && strcasecmp($pair[0], 'To') === 0) {
                        $toHdr = $pair[1];
                        break;
                    }
                }
            }
        }

        // Usar a primeira fonte disponível
        $target = $rcpt ?: $to ?: $toHdr;

        if (empty($target)) {
            Log::warning('Nenhum recipient encontrado', [
                'recipient' => $rcpt,
                'to' => $to,
                'has_headers' => $request->filled('message-headers'),
            ]);
            return null;
        }

        // Tentar extrair local-part@tickets.fluxdesk.com.br
        if (!preg_match('/^([^@]+)@tickets\.fluxdesk\.com\.br$/i', $target, $m)) {
            // Não é um e-mail para tickets.fluxdesk.com.br
            return null;
        }

        $local = strtolower(trim($m[1]));

        // Ignorar endereços de resposta (reply+tkt.*)
        if (str_starts_with($local, 'reply+tkt.')) {
            return null;
        }

        // Tentar identificar tenant por:
        // 1. slug
        $tenant = \App\Models\Tenant::withoutGlobalScopes()
            ->where('slug', $local)
            ->where('is_active', true)
            ->first();

        if ($tenant) {
            Log::info('Tenant encontrado por slug', ['slug' => $local]);
            return $tenant;
        }

        // 2. email_code
        $tenant = \App\Models\Tenant::withoutGlobalScopes()
            ->where('email_code', $local)
            ->where('is_active', true)
            ->first();

        if ($tenant) {
            Log::info('Tenant encontrado por email_code', ['email_code' => $local]);
            return $tenant;
        }

        // 3. ID numérico (se for apenas dígitos)
        if (ctype_digit($local)) {
            $tenant = \App\Models\Tenant::withoutGlobalScopes()
                ->where('id', (int) $local)
                ->where('is_active', true)
                ->first();

            if ($tenant) {
                Log::info('Tenant encontrado por ID', ['id' => (int) $local]);
                return $tenant;
            }
        }

        // Não encontrou o tenant
        Log::warning('Inbound sem tenant match', [
            'recipient' => $rcpt,
            'to' => $to,
            'toHdr' => $toHdr,
            'local' => $local,
        ]);

        return null;
    }

    /**
     * Enfileira a criação de um novo ticket para o tenant.
     */
    protected function queueNewTicket(\App\Models\Tenant $tenant, Request $request): JsonResponse
    {
        // Obter Message-ID (idempotência)
        $messageId = $request->input('Message-Id') ?: $request->input('message-id', '');
        
        if (empty($messageId)) {
            // Gerar ID baseado em hash se não houver Message-ID
            $messageId = 'no-msgid:' . sha1(
                $request->input('sender', '') . '|' .
                $request->input('timestamp', '') . '|' .
                substr($request->input('body-plain', ''), 0, 200)
            );
        }

        $messageId = trim($messageId, '<>');
        $cacheKey = 'mg:msg:' . sha1($messageId);

        // Idempotência: verificar se já processamos este Message-ID
        if (!Cache::add($cacheKey, true, now()->addHours(48))) {
            Log::info('E-mail duplicado (idempotência)', [
                'message_id' => $messageId,
                'tenant_id' => $tenant->id,
            ]);
            
            return response()->json(['status' => 'duplicate', 'message_id' => $messageId], 200);
        }

        // Despachar job assíncrono para criar novo ticket
        EmailIngestJob::dispatch(
            messageId: $messageId,
            from: $request->input('sender', ''),
            subject: $request->input('subject', 'Sem assunto'),
            to: $request->input('recipient'),
            s3ObjectKey: null,
            rawPayload: $request->all(),
            ticketId: null, // Não é resposta
            tenantSlug: $tenant->slug
        );

        Log::info('Novo ticket enfileirado para processamento', [
            'tenant_id' => $tenant->id,
            'tenant_slug' => $tenant->slug,
            'message_id' => $messageId,
            'from' => $request->input('sender'),
        ]);

        return response()->json([
            'ok' => true,
            'tenant_id' => $tenant->id,
            'message_id' => $messageId,
            'action' => 'new_ticket',
        ], 200);
    }
}
