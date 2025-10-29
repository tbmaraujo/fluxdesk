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
     * Suporta 3 métodos de identificação (em ordem de prioridade):
     * 1. Reply-To com HMAC (reply+tkt.{slug}.{id}.{hmac}@domain)
     * 2. Threading headers (In-Reply-To/References)
     * 3. Subject com [TKT-ID]
     */
    public function handleInbound(Request $request): JsonResponse
    {
        try {
            $recipient = $request->input('recipient');
            $subject = $request->input('subject', 'Sem assunto');

            Log::info('Mailgun inbound recebido', [
                'recipient' => $recipient,
                'from' => $request->input('sender'),
                'subject' => $subject,
            ]);

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
}
