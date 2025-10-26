<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TicketEmail extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'ticket_id',
        'message_id',
        'from',
        'to',
        'subject',
        'raw',
        's3_object_key',
        'status',
        'error_message',
        'received_at',
    ];

    protected $casts = [
        'received_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relacionamento com Tenant
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Relacionamento com Ticket
     */
    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }

    /**
     * Marca o email como processado
     */
    public function markAsProcessed(?int $ticketId = null): void
    {
        $this->update([
            'status' => 'processed',
            'ticket_id' => $ticketId,
        ]);
    }

    /**
     * Marca o email como falho
     */
    public function markAsFailed(string $errorMessage): void
    {
        $this->update([
            'status' => 'failed',
            'error_message' => $errorMessage,
        ]);
    }

    /**
     * Verifica se já foi processado
     */
    public function isProcessed(): bool
    {
        return $this->status === 'processed';
    }

    /**
     * Verifica se falhou
     */
    public function isFailed(): bool
    {
        return $this->status === 'failed';
    }
}

