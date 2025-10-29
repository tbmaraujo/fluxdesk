<?php

use App\Http\Controllers\Api\EmailInboundController;
use App\Http\Controllers\Api\MailgunInboundController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Webhook público do Mailgun Routes (sem auth/tenant/throttle)
Route::post('/webhooks/mailgun-inbound', [MailgunInboundController::class, 'handleInbound'])
    ->name('webhooks.mailgun.inbound')
    ->withoutMiddleware([
        \Illuminate\Auth\Middleware\Authenticate::class,
        \App\Http\Middleware\IdentifyTenant::class,
        'auth', 'auth:api', 'auth:sanctum',
        'throttle:api',
    ]);

// Webhook público do SNS/SES (mantido para compatibilidade/rollback)
// Remova se não for mais usar o SES
Route::post('/webhooks/ses-inbound', [EmailInboundController::class, 'handleSnsNotification'])
    ->name('webhooks.ses.inbound')
    ->withoutMiddleware([
        \Illuminate\Auth\Middleware\Authenticate::class,
        \App\Http\Middleware\IdentifyTenant::class,
        'auth', 'auth:api', 'auth:sanctum',
        'throttle:api',
    ]);
