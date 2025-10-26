<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Ticket extends Model
{
    use HasFactory;
    use \App\Models\Traits\BelongsToTenant;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        "title",
        "description",
        "status",
        "stage",
        "priority",
        "service_id",
        "ticket_type_id",
        "user_id",
        "contact_id", // Solicitante (contato do cliente)
        "assignee_id",
        "parent_id",
        "grouped_ticket_id",
        "client_id",
        "tenant_id", // ✅ CRITICAL FIX: Permitir mass assignment de tenant_id
        "first_response_at",
        "sla_paused_at",
        "sla_pause_reason",
        "sla_total_paused_minutes",
    ];

    /**
     * Get the user who created this ticket.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the contact (requester) for this ticket.
     */
    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    /**
     * Get the user assigned to this ticket.
     */
    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, "assignee_id");
    }

    /**
     * Get the service of this ticket.
     */
    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    /**
     * Get the ticket type of this ticket.
     */
    public function ticketType(): BelongsTo
    {
        return $this->belongsTo(TicketType::class);
    }

    /**
     * Get the parent ticket.
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Ticket::class, "parent_id");
    }

    /**
     * Get the child tickets.
     */
    public function children()
    {
        return $this->hasMany(Ticket::class, "parent_id");
    }

    /**
     * Get the replies for this ticket.
     */
    public function replies()
    {
        return $this->hasMany(Reply::class)->orderBy("created_at", "asc");
    }

    /**
     * Get the appointments for this ticket.
     */
    public function appointments()
    {
        return $this->hasMany(Appointment::class)->orderBy(
            "start_time",
            "desc",
        );
    }

    /**
     * Get the client that owns the ticket.
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    /**
     * Get the attachments for this ticket.
     */
    public function attachments()
    {
        return $this->morphMany(Attachment::class, 'attachable')->orderBy("created_at", "asc");
    }

    /**
     * Get the ticket this ticket is grouped to.
     */
    public function groupedTicket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class, "grouped_ticket_id");
    }

    /**
     * Get the tickets grouped to this ticket.
     */
    public function groupedTickets()
    {
        return $this->hasMany(Ticket::class, "grouped_ticket_id");
    }

    /**
     * Get the current stage of the ticket.
     */
    public function currentStage(): BelongsTo
    {
        return $this->belongsTo(ServiceStage::class, "stage");
    }
}
