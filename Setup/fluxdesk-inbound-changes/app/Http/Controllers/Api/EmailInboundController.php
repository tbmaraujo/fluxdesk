<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\EmailInboundService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class EmailInboundController extends Controller
{
    public function __construct(
        private EmailInboundService $emailInboundService
    ) {
        // NÃO aplique middleware de auth aqui; a rota já está pública.
        // Se precisar de auth em outras actions, use ->except('handleSnsNotification').
    }

    /**
     * Webhook para receber notificações do Amazon SES via SNS.
     */
    public function handleSnsNotification(Request $request): JsonResponse
    {
        try {
            $snsType = $request->header('x-amz-sns-message-type'); // SubscriptionConfirmation | Notification | UnsubscribeConfirmation
            $rawBody = $request->getContent();
            $body    = json_decode($rawBody, true) ?: [];

            if ($snsType) {
                // ---- Fluxo SNS (não exige X-Webhook-Secret) ----
                // 1) (opcional mas recomendado) valide o TopicArn
                $expectedTopic = (string) config('services.ses.topic_arn', '');
                $gotTopic      = (string) ($body['TopicArn'] ?? '');
                if ($expectedTopic !== '' && $gotTopic !== $expectedTopic) {
                    Log::warning('SNS TopicArn mismatch', ['got' => $gotTopic, 'expected' => $expectedTopic]);
                    // 401 para não confirmar uma assinatura errada
                    return response()->json(['error' => 'Unauthorized'], 401);
                }

                // 2) (opcional) validação de assinatura SNS (TODO)
                // if (!$this->isValidSnsSignature($body)) { ... }

                switch ($snsType) {
                    case 'SubscriptionConfirmation':
                        return $this->handleSubscriptionConfirmation($body);

                    case 'Notification':
                        return $this->handleEmailNotification($body);

                    case 'UnsubscribeConfirmation':
                        Log::warning('SNS UnsubscribeConfirmation recebido', ['topic' => $gotTopic]);
                        return response()->json(['ok' => true, 'message' => 'Unsubscribe acknowledged'], 200);

                    default:
                        Log::warning('SNS tipo desconhecido', ['type' => $snsType, 'body' => $body]);
                        // Responder 200 para evitar retries infinitos do SNS
                        return response()->json(['ignored' => true], 200);
                }
            }

            // ---- Fluxo NÃO-SNS (ex.: testes internos) → exige secret próprio ----
            $webhookSecret = trim((string) $request->header('X-Webhook-Secret', ''));
            if ($webhookSecret !== (string) config('services.ses.webhook_secret')) {
                Log::warning('Webhook custom sem secret válido', [
                    'ip' => $request->ip(),
                ]);
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            // Se quiser aceitar testes simples:
            Log::info('Webhook custom recebido', ['body' => $body]);
            return response()->json(['ok' => true], 200);

        } catch (\Throwable $e) {
            Log::error('Erro ao processar webhook SNS', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            // 200 para o SNS não ficar reentregando sem fim; ajuste para 500 se preferir retries
            return response()->json(['error' => 'Internal error'], 200);
        }
    }

    /**
     * Confirma a assinatura do SNS usando a SubscribeURL.
     */
    private function handleSubscriptionConfirmation(array $snsMessage): JsonResponse
    {
        $subscribeUrl = $snsMessage['SubscribeURL'] ?? null;

        if (!$subscribeUrl) {
            Log::error('SNS SubscriptionConfirmation sem SubscribeURL', ['body' => $snsMessage]);
            // 200 para não gerar retries eternos
            return response()->json(['error' => 'SubscribeURL missing'], 200);
        }

        try {
            Http::timeout(8)->retry(2, 200)->get($subscribeUrl);
            Log::info('SNS assinatura confirmada', [
                'topic_arn' => $snsMessage['TopicArn'] ?? 'unknown',
            ]);
            return response()->json([
                'message' => 'Subscription confirmed',
                'topic'   => $snsMessage['TopicArn'] ?? 'unknown',
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Falha ao confirmar assinatura SNS', [
                'error' => $e->getMessage(),
                'url'   => $subscribeUrl,
            ]);
            // 200 para o SNS tentar reentregar depois
            return response()->json(['error' => 'Subscribe confirmation failed'], 200);
        }
    }

    /**
     * Processa a Notification do SNS (payload real vem em "Message" como string JSON).
     */
    private function handleEmailNotification(array $snsMessage): JsonResponse
    {
        $messageStr = (string) ($snsMessage['Message'] ?? '');
        $payload    = json_decode($messageStr, true);

        if (!is_array($payload)) {
            Log::error('SNS Notification com Message inválido', [
                'raw' => mb_substr($messageStr, 0, 2000),
            ]);
            return response()->json(['error' => 'Invalid Message'], 200);
        }

        try {
            // Ex.: $payload['mail']['messageId'], $payload['receipt']['action']['objectKey'], etc.
            $this->emailInboundService->process($payload);

            Log::info('SNS Notification processada', [
                'messageId' => $payload['mail']['messageId'] ?? null,
            ]);

            return response()->json(['ok' => true], 200);
        } catch (\Throwable $e) {
            Log::error('Erro ao processar Notification', [
                'error'      => $e->getMessage(),
                'messageId'  => $payload['mail']['messageId'] ?? null,
                'stack'      => $e->getTraceAsString(),
            ]);
            // 200 para evitar retries em loop (ou 500 se quiser reentrega)
            return response()->json(['error' => 'Processing failed'], 200);
        }
    }

    /**
     * (Opcional) Validação de assinatura do SNS.
     * Implemente se quiser reforço de segurança:
     * - Baixar e cachear o certificado de SigningCertURL
     * - Verificar Signature com os campos canônicos
     */
    // private function isValidSnsSignature(array $sns): bool
    // {
    //     return true;
    // }
}
