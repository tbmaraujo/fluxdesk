<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\EmailInboundController;

// Webhook público do SNS/SES (sem auth/tenant/throttle)
Route::post('/webhooks/ses-inbound', [EmailInboundController::class, 'handleSnsNotification'])
    ->name('webhooks.ses.inbound')
    ->withoutMiddleware([
        \Illuminate\Auth\Middleware\Authenticate::class,
        \App\Http\Middleware\IdentifyTenant::class,
        'auth', 'auth:api', 'auth:sanctum',
        'throttle:api',
    ]);

