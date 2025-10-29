<?php

namespace App\Jobs;

use App\Models\TicketEmail;
use App\Services\EmailInboundService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class EmailIngestJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Número de vezes que o job pode tentar executar
     */
    public $tries = 3;

    /**
     * Timeout em segundos
     */
    public $timeout = 120;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public string $messageId,
        public string $from,
        public string $subject,
        public ?string $to = null,
        public ?string $s3ObjectKey = null,
        public ?array $rawPayload = null,
        public ?int $ticketId = null,         // Ticket ID já identificado (respostas)
        public ?string $tenantSlug = null,   // Slug do tenant (respostas)
    ) {
    }

    /**
     * Execute the job.
     */
    public function handle(EmailInboundService $emailInboundService): void
    {
        // Lock atômico para prevenir processamento simultâneo do mesmo e-mail
        $lock = \Illuminate\Support\Facades\Cache::lock('email_ingest_' . $this->messageId, 120);

        try {
            // Tentar adquirir lock (espera até 10 segundos)
            if (!$lock->block(10)) {
                Log::warning('Não foi possível adquirir lock para processar e-mail', [
                    'message_id' => $this->messageId,
                ]);
                return;
            }

            // 1. Buscar registro de e-mail (já foi criado pelo controller)
            $ticketEmail = TicketEmail::where('message_id', $this->messageId)->first();

            if (!$ticketEmail) {
                // Fallback: criar se não existir (proteção extra)
                Log::warning('Registro de e-mail não encontrado, criando agora', [
                    'message_id' => $this->messageId,
                ]);
                
                $ticketEmail = TicketEmail::create([
                    'message_id' => $this->messageId,
                    'from' => $this->from,
                    'to' => $this->to,
                    'subject' => $this->subject,
                    'raw' => $this->rawPayload ? json_encode($this->rawPayload) : null,
                    's3_object_key' => $this->s3ObjectKey,
                    'status' => 'queued',
                    'received_at' => now(),
                ]);
            }

            // 2. Verificar se já foi processado (idempotência)
            if ($ticketEmail->isProcessed()) {
                Log::info('Email já processado anteriormente', [
                    'message_id' => $this->messageId,
                    'ticket_id' => $ticketEmail->ticket_id,
                ]);
                return;
            }

            if ($ticketEmail->isFailed()) {
                Log::warning('Reprocessando email que falhou anteriormente', [
                    'message_id' => $this->messageId,
                ]);
            }

            // 3. Atualizar raw payload se ainda não tiver
            if ($this->rawPayload && !$ticketEmail->raw) {
                $ticketEmail->update([
                    'raw' => json_encode($this->rawPayload),
                ]);
            }

            // 4. Processar email
            if ($this->rawPayload) {
                // Se ticketId foi fornecido, é uma resposta direta (via Reply-To HMAC)
                if ($this->ticketId) {
                    $result = $emailInboundService->processDirectReply(
                        $this->ticketId,
                        $this->tenantSlug,
                        $this->from,
                        $this->rawPayload,
                        $this->messageId
                    );
                } else {
                    // Fluxo normal: criar novo ticket ou identificar por headers
                    $result = $emailInboundService->processInboundEmail($this->rawPayload);
                }

                // 5. Atualizar registro como processado
                $ticketEmail->markAsProcessed($result['ticket_id'] ?? null);

                Log::info('Email ingerido e processado com sucesso', [
                    'message_id' => $this->messageId,
                    'ticket_id' => $result['ticket_id'] ?? null,
                    'action' => $result['action'] ?? 'unknown',
                ]);
            } else {
                // Se não tiver payload completo, marcar como processado mas sem criar ticket
                $ticketEmail->markAsProcessed();
                Log::warning('Email ingerido sem payload completo', [
                    'message_id' => $this->messageId,
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Erro ao processar email no job', [
                'message_id' => $this->messageId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Marcar como falho
            if (isset($ticketEmail)) {
                $ticketEmail->markAsFailed($e->getMessage());
            }

            // Re-lançar exceção para que o Laravel gerencie os retries
            throw $e;
        } finally {
            // Sempre liberar o lock
            optional($lock)->release();
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('EmailIngestJob falhou após todas as tentativas', [
            'message_id' => $this->messageId,
            'error' => $exception->getMessage(),
        ]);

        // Tentar marcar como falho se o registro existir
        $email = TicketEmail::where('message_id', $this->messageId)->first();
        if ($email) {
            $email->markAsFailed('Job failed after all retries: ' . $exception->getMessage());
        }
    }
}
