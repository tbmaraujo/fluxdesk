<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReportType extends Model
{
    use HasFactory;
    use \App\Models\Traits\BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'name',
        'description',
    ];
}
