<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\EmailIngestJob;
use App\Models\TicketEmail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MailgunInboundController extends Controller
{
    /**
     * Webhook para receber e-mails do Mailgun Routes.
     * 
     * Documentação: https://documentation.mailgun.com/en/latest/api-routes.html
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function handleInbound(Request $request): JsonResponse
    {
        try {
            // Validar assinatura do Mailgun (HMAC SHA256)
            if (!$this->verifyWebhookSignature($request)) {
                Log::warning('Mailgun webhook com assinatura inválida', [
                    'ip' => $request->ip(),
                ]);
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            // Extrair dados do e-mail
            $sender = $request->input('sender'); // From
            $recipient = $request->input('recipient'); // To
            $subject = $request->input('subject', 'Sem assunto');
            $bodyPlain = $request->input('body-plain', '');
            $bodyHtml = $request->input('body-html', '');
            $strippedText = $request->input('stripped-text', ''); // Texto sem assinaturas
            $strippedSignature = $request->input('stripped-signature', '');
            $messageId = $request->input('Message-Id');
            $inReplyTo = $request->input('In-Reply-To');
            $references = $request->input('References');
            $timestamp = $request->input('timestamp');
            $token = $request->input('token');
            $signature = $request->input('signature');

            // Headers customizados
            $messageHeaders = $request->input('message-headers');

            Log::info('Mailgun inbound recebido', [
                'from' => $sender,
                'to' => $recipient,
                'subject' => $subject,
                'message_id' => $messageId,
            ]);

            // Verificar idempotência (evitar processar e-mail duplicado)
            if ($messageId && TicketEmail::where('message_id', $messageId)->exists()) {
                Log::info('E-mail já processado (idempotência)', [
                    'message_id' => $messageId,
                ]);
                return response()->json(['ok' => true, 'status' => 'already_processed'], 200);
            }

            // Processar anexos
            $attachments = [];
            $attachmentCount = (int) $request->input('attachment-count', 0);
            
            for ($i = 1; $i <= $attachmentCount; $i++) {
                if ($request->hasFile("attachment-{$i}")) {
                    $file = $request->file("attachment-{$i}");
                    $attachments[] = [
                        'name' => $file->getClientOriginalName(),
                        'type' => $file->getMimeType(),
                        'size' => $file->getSize(),
                        'content' => base64_encode(file_get_contents($file->getRealPath())),
                    ];
                }
            }

            // Montar payload no formato que o EmailInboundService espera
            $payload = [
                'mail' => [
                    'source' => $sender,
                    'destination' => [$recipient],
                    'messageId' => $messageId,
                    'timestamp' => $timestamp,
                    'commonHeaders' => [
                        'from' => [$sender],
                        'to' => [$recipient],
                        'subject' => $subject,
                        'messageId' => $messageId,
                        'inReplyTo' => $inReplyTo,
                        'references' => $references,
                    ],
                ],
                'content' => [
                    'plain' => $bodyPlain,
                    'html' => $bodyHtml,
                    'stripped_text' => $strippedText,
                    'stripped_signature' => $strippedSignature,
                ],
                'attachments' => $attachments,
                'headers' => $this->parseMessageHeaders($messageHeaders),
            ];

            // Despachar job assíncrono
            EmailIngestJob::dispatch($payload, $messageId);

            Log::info('E-mail Mailgun enfileirado para processamento', [
                'message_id' => $messageId,
                'from' => $sender,
                'to' => $recipient,
            ]);

            return response()->json([
                'ok' => true,
                'message' => 'Email queued for processing',
                'message_id' => $messageId,
            ], 200);

        } catch (\Throwable $e) {
            Log::error('Erro ao processar webhook Mailgun', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'ip' => $request->ip(),
            ]);

            return response()->json([
                'error' => 'Internal server error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Verifica a assinatura do webhook do Mailgun.
     * 
     * @param Request $request
     * @return bool
     */
    private function verifyWebhookSignature(Request $request): bool
    {
        $signingKey = config('services.mailgun.webhook_signing_key');
        
        // Se não houver signing key configurada, pular validação (dev)
        if (empty($signingKey)) {
            Log::warning('Mailgun webhook signing key não configurada - pulando validação');
            return true;
        }

        $timestamp = $request->input('timestamp');
        $token = $request->input('token');
        $signature = $request->input('signature');

        if (!$timestamp || !$token || !$signature) {
            Log::warning('Mailgun webhook sem campos de assinatura', [
                'has_timestamp' => !empty($timestamp),
                'has_token' => !empty($token),
                'has_signature' => !empty($signature),
            ]);
            return false;
        }

        // Verificar se o timestamp não é muito antigo (prevenir replay attacks)
        $now = time();
        if (abs($now - $timestamp) > 300) { // 5 minutos
            Log::warning('Mailgun webhook com timestamp expirado', [
                'timestamp' => $timestamp,
                'now' => $now,
                'diff' => abs($now - $timestamp),
            ]);
            return false;
        }

        // Calcular HMAC SHA256
        $expectedSignature = hash_hmac('sha256', $timestamp . $token, $signingKey);

        $isValid = hash_equals($expectedSignature, $signature);

        if (!$isValid) {
            Log::warning('Mailgun webhook com assinatura inválida', [
                'expected' => $expectedSignature,
                'got' => $signature,
            ]);
        }

        return $isValid;
    }

    /**
     * Parseia headers do Mailgun (formato JSON string).
     * 
     * @param string|null $messageHeaders
     * @return array
     */
    private function parseMessageHeaders(?string $messageHeaders): array
    {
        if (empty($messageHeaders)) {
            return [];
        }

        try {
            $headers = json_decode($messageHeaders, true);
            
            if (!is_array($headers)) {
                return [];
            }

            // Converter para formato key => value
            $parsed = [];
            foreach ($headers as $header) {
                if (is_array($header) && count($header) >= 2) {
                    $parsed[$header[0]] = $header[1];
                }
            }

            return $parsed;
        } catch (\Throwable $e) {
            Log::warning('Erro ao parsear message-headers do Mailgun', [
                'error' => $e->getMessage(),
            ]);
            return [];
        }
    }
}

