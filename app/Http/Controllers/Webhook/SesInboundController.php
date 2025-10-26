<?php

namespace App\Http\Controllers\Webhook;

use App\Http\Controllers\Controller;
use App\Http\Requests\SesWebhookRequest;
use App\Jobs\EmailIngestJob;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SesInboundController extends Controller
{
    /**
     * Webhook para receber notificações do Amazon SES.
     * 
     * Pode receber:
     * 1. SNS notifications (production) - via header x-amz-sns-message-type
     * 2. Direct webhooks (testing) - via header X-SES-Secret
     */
    public function store(SesWebhookRequest $request): JsonResponse
    {
        try {
            $snsType = $request->header('x-amz-sns-message-type');
            
            if ($snsType) {
                // Processar como notificação SNS
                return $this->handleSnsNotification($request);
            }

            // Processar como webhook direto (testes)
            return $this->handleDirectWebhook($request);

        } catch (\Throwable $e) {
            Log::error('Erro ao processar webhook SES', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Retornar 200 para evitar retries infinitos do SNS
            return response()->json(['error' => 'Internal error'], 200);
        }
    }

    /**
     * Processar notificação SNS
     */
    private function handleSnsNotification(SesWebhookRequest $request): JsonResponse
    {
        $snsType = $request->header('x-amz-sns-message-type');
        $rawBody = $request->getContent();
        $body = json_decode($rawBody, true) ?: [];

        // Validar TopicArn (opcional mas recomendado)
        $expectedTopic = (string) config('services.ses.topic_arn', '');
        $gotTopic = (string) ($body['TopicArn'] ?? '');
        
        if ($expectedTopic !== '' && $gotTopic !== $expectedTopic) {
            Log::warning('SNS TopicArn mismatch', [
                'got' => $gotTopic,
                'expected' => $expectedTopic,
            ]);
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        switch ($snsType) {
            case 'SubscriptionConfirmation':
                return $this->confirmSnsSubscription($body);

            case 'Notification':
                return $this->processEmailNotification($body);

            case 'UnsubscribeConfirmation':
                Log::warning('SNS UnsubscribeConfirmation recebido', [
                    'topic' => $gotTopic,
                ]);
                return response()->json(['ok' => true, 'message' => 'Unsubscribe acknowledged'], 200);

            default:
                Log::warning('SNS tipo desconhecido', [
                    'type' => $snsType,
                    'body' => $body,
                ]);
                return response()->json(['ignored' => true], 200);
        }
    }

    /**
     * Confirmar assinatura SNS
     */
    private function confirmSnsSubscription(array $snsMessage): JsonResponse
    {
        $subscribeUrl = $snsMessage['SubscribeURL'] ?? null;

        if (!$subscribeUrl) {
            Log::error('SubscribeURL ausente na confirmação SNS');
            return response()->json(['error' => 'Missing SubscribeURL'], 400);
        }

        try {
            // Confirmar assinatura fazendo GET no URL
            $response = Http::timeout(10)->get($subscribeUrl);

            if ($response->successful()) {
                Log::info('Assinatura SNS confirmada com sucesso', [
                    'topic' => $snsMessage['TopicArn'] ?? 'unknown',
                ]);
                return response()->json(['ok' => true, 'message' => 'Subscription confirmed'], 200);
            }

            Log::error('Falha ao confirmar assinatura SNS', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            return response()->json(['error' => 'Failed to confirm subscription'], 500);

        } catch (\Exception $e) {
            Log::error('Erro ao confirmar assinatura SNS', [
                'error' => $e->getMessage(),
            ]);
            return response()->json(['error' => 'Exception confirming subscription'], 500);
        }
    }

    /**
     * Processar notificação de email (SNS)
     */
    private function processEmailNotification(array $snsMessage): JsonResponse
    {
        // Extrair mensagem do SNS
        $messageJson = $snsMessage['Message'] ?? '';
        $messageContent = json_decode($messageJson, true);

        if (!$messageContent) {
            Log::warning('Mensagem SNS sem conteúdo válido');
            return response()->json(['ok' => true], 200);
        }

        // Extrair dados do email
        $mail = $messageContent['mail'] ?? [];
        $commonHeaders = $mail['commonHeaders'] ?? [];
        $receipt = $messageContent['receipt'] ?? [];
        $action = $receipt['action'] ?? [];

        $messageId = $mail['messageId'] ?? '';
        $from = $mail['source'] ?? '';
        $to = $mail['destination'][0] ?? '';
        $subject = $commonHeaders['subject'] ?? 'Sem assunto';
        $s3ObjectKey = $action['objectKey'] ?? null;

        if (!$messageId || !$from) {
            Log::warning('Email sem message_id ou from', [
                'messageContent' => $messageContent,
            ]);
            return response()->json(['ok' => true], 200);
        }

        // Enfileirar job para processamento assíncrono
        EmailIngestJob::dispatch(
            messageId: $messageId,
            from: $from,
            subject: $subject,
            to: $to,
            s3ObjectKey: $s3ObjectKey,
            rawPayload: $messageContent,
        );

        Log::info('Email enfileirado para processamento', [
            'message_id' => $messageId,
            'from' => $from,
            'subject' => $subject,
        ]);

        return response()->json(['ok' => true, 'message' => 'Email queued'], 200);
    }

    /**
     * Processar webhook direto (não SNS) - para testes
     */
    private function handleDirectWebhook(SesWebhookRequest $request): JsonResponse
    {
        $validated = $request->validated();

        // Enfileirar job
        EmailIngestJob::dispatch(
            messageId: $validated['message_id'],
            from: $validated['from'],
            subject: $validated['subject'],
            to: $validated['to'] ?? null,
            s3ObjectKey: $validated['s3_object_key'] ?? null,
            rawPayload: $request->all(),
        );

        Log::info('Webhook direto recebido e enfileirado', [
            'message_id' => $validated['message_id'],
            'from' => $validated['from'],
        ]);

        return response()->json(['ok' => true, 'message' => 'Email queued'], 200);
    }
}

