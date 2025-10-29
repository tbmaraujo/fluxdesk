<?php

namespace App\Mail;

use App\Models\Ticket;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TicketCreatedNotification extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     */
    public function __construct(
        public Ticket $ticket
    ) {}

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        // Gerar Reply-To com HMAC para identificação segura
        $replyToAddress = $this->generateSecureReplyTo();
        
        return new Envelope(
            subject: '[TKT-' . $this->ticket->id . '] ' . $this->ticket->title,
            replyTo: [
                $replyToAddress,
            ],
        );
    }

    /**
     * Generate secure Reply-To address with HMAC.
     */
    protected function generateSecureReplyTo(): string
    {
        $tenant = $this->ticket->tenant;
        $slug = $tenant?->slug ?? $this->ticket->tenant_id;
        $ticketId = $this->ticket->id;
        $secret = config('services.reply.hmac_secret');
        
        if (empty($secret)) {
            // Fallback para formato antigo se HMAC não configurado
            return "{$slug}@" . config('services.reply.domain', 'tickets.fluxdesk.com.br');
        }
        
        // Gerar HMAC (10 caracteres do meio do hash)
        $hmac = substr(hash_hmac('sha256', "{$slug}|{$ticketId}", $secret), 10, 10);
        $domain = config('services.reply.domain', 'tickets.fluxdesk.com.br');
        
        return "reply+tkt.{$slug}.{$ticketId}.{$hmac}@{$domain}";
    }

    /**
     * Handle after the mail is sent.
     */
    public function sent(\Illuminate\Mail\SentMessage $message): void
    {
        // Registrar notificação para threading
        $messageId = $message->getMessageId();
        
        if ($messageId) {
            \App\Models\TicketNotification::create([
                'ticket_id' => $this->ticket->id,
                'tenant_slug' => $this->ticket->tenant?->slug ?? (string) $this->ticket->tenant_id,
                'message_id' => trim($messageId, '<>'),
                'reply_to' => $this->generateSecureReplyTo(),
                'sent_at' => now(),
            ]);
        }
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.tickets.created',
            with: [
                'ticket' => $this->ticket,
                'ticketUrl' => route('tickets.show', $this->ticket->id),
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
