<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ContractVersion extends Model
{
    use HasFactory;
    use \App\Models\Traits\BelongsToTenant;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'contract_id',
        'tenant_id',
        'user_id',
        'version',
        'is_active_version',
        'description',
        'activity_type',
        // Campos de Status e Vigência
        'start_date',
        'end_date',
        'renewal_date',
        'expiration_term',
        'auto_renewal',
        'status',
        // Campos de Condições Financeiras
        'monthly_value',
        'payment_day',
        'due_day',
        'discount',
        'billing_cycle',
        'closing_cycle',
        'payment_method',
        'billing_type',
        'contract_term',
        // Campos da modalidade "Horas"
        'included_hours',
        'extra_hour_value',
        // Campos da modalidade "Livre (Ilimitado)"
        'scope_included',
        'scope_excluded',
        'fair_use_policy',
        'visit_limit',
        // Campos da modalidade "Por Atendimento"
        'included_tickets',
        'extra_ticket_value',
        // Campos da modalidade "Horas Cumulativas" (Rollover)
        'rollover_active',
        'rollover_days_window',
        'rollover_hours_limit',
        // Campos da modalidade "SaaS/Produto"
        'appointments_when_pending',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'is_active_version' => 'boolean',
        'start_date' => 'date',
        'end_date' => 'date',
        'renewal_date' => 'date',
        'auto_renewal' => 'boolean',
        'monthly_value' => 'decimal:2',
        'discount' => 'decimal:2',
        'included_hours' => 'decimal:2',
        'extra_hour_value' => 'decimal:2',
        'extra_ticket_value' => 'decimal:2',
        'rollover_active' => 'boolean',
        'appointments_when_pending' => 'boolean',
    ];

    /**
     * Get the contract that owns this version.
     */
    public function contract(): BelongsTo
    {
        return $this->belongsTo(Contract::class);
    }

    /**
     * Get the user who created/updated this version.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the items for this contract version (SaaS/Produto modality).
     */
    public function items(): HasMany
    {
        return $this->hasMany(ContractItem::class, 'contract_id', 'contract_id');
    }

    /**
     * Calculate end_date based on start_date and expiration_term.
     * 
     * @return \Carbon\Carbon|null
     */
    public function calculateEndDate(): ?\Carbon\Carbon
    {
        if (!$this->start_date || !$this->expiration_term) {
            return null;
        }

        if ($this->expiration_term === 'Indeterminado') {
            return null;
        }

        // Parse expiration_term (e.g., "12 meses", "24 meses")
        if (preg_match('/(\d+)\s*meses?/i', $this->expiration_term, $matches)) {
            $months = (int) $matches[1];
            return \Carbon\Carbon::parse($this->start_date)->addMonths($months);
        }

        return null;
    }

    /**
     * Boot the model and listen to saving event to auto-calculate end_date.
     */
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($contractVersion) {
            // Auto-calculate end_date before saving
            if ($contractVersion->start_date && $contractVersion->expiration_term) {
                $calculatedEndDate = $contractVersion->calculateEndDate();
                if ($calculatedEndDate) {
                    $contractVersion->end_date = $calculatedEndDate->format('Y-m-d');
                } else {
                    $contractVersion->end_date = null;
                }
            }
        });
    }
}
