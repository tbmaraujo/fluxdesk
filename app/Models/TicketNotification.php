<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TicketNotification extends Model
{
    use HasFactory;

    protected $fillable = [
        'ticket_id',
        'tenant_slug',
        'message_id',
        'reply_to',
        'sent_at',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
    ];

    /**
     * Get the ticket for this notification.
     */
    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }

    /**
     * Match notification by threading headers (In-Reply-To or References).
     *
     * @param string|null $inReplyTo
     * @param string|null $references
     * @return self|null
     */
    public static function matchByThreading(?string $inReplyTo, ?string $references): ?self
    {
        if (empty($inReplyTo) && empty($references)) {
            return null;
        }

        // Extrair todos os Message-IDs dos headers
        $messageIds = [];
        
        if ($inReplyTo) {
            preg_match_all('/<([^>]+)>/', $inReplyTo, $matches);
            $messageIds = array_merge($messageIds, $matches[1] ?? []);
        }
        
        if ($references) {
            preg_match_all('/<([^>]+)>/', $references, $matches);
            $messageIds = array_merge($messageIds, $matches[1] ?? []);
        }

        $messageIds = array_unique(array_filter($messageIds));

        if (empty($messageIds)) {
            return null;
        }

        // Buscar notificação mais recente que corresponda
        return self::whereIn('message_id', $messageIds)
            ->orderBy('sent_at', 'desc')
            ->first();
    }
}

