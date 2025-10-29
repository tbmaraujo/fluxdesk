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
        // Usar slug do tenant para o Reply-To
        $tenant = $this->ticket->tenant;
        $replyToAddress = ($tenant && $tenant->slug) 
            ? $tenant->slug . '@tickets.fluxdesk.com.br'
            : $this->ticket->tenant_id . '@tickets.fluxdesk.com.br'; // Fallback para ID
        
        return new Envelope(
            subject: '[TKT-' . $this->ticket->id . '] ' . $this->ticket->title,
            replyTo: [
                $replyToAddress,
            ],
        );
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
