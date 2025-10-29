<?php

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

// Webhook público do Mailgun Routes (com validação de assinatura)
Route::post('/webhooks/mailgun-inbound', [MailgunInboundController::class, 'handleInbound'])
    ->name('webhooks.mailgun.inbound')
    ->middleware(\App\Http\Middleware\VerifyMailgunSignature::class)
    ->withoutMiddleware([
        \Illuminate\Auth\Middleware\Authenticate::class,
        \App\Http\Middleware\IdentifyTenant::class,
        'auth', 'auth:api', 'auth:sanctum',
        'throttle:api',
    ]);

// Endpoint de teste/diagnóstico (SEM validação de assinatura)
// REMOVER EM PRODUÇÃO após testar
Route::post('/webhooks/mailgun-test', function (\Illuminate\Http\Request $request) {
    \Illuminate\Support\Facades\Log::info('=== MAILGUN TEST ENDPOINT ===', [
        'timestamp' => now()->toIso8601String(),
        'ip' => $request->ip(),
        'user_agent' => $request->userAgent(),
        'method' => $request->method(),
        'all_data' => $request->all(),
        'headers' => $request->headers->all(),
    ]);
    
    return response()->json([
        'status' => 'received',
        'timestamp' => now()->toIso8601String(),
        'data_received' => $request->all(),
    ], 200);
})->withoutMiddleware([
    \Illuminate\Auth\Middleware\Authenticate::class,
    \App\Http\Middleware\IdentifyTenant::class,
    'auth', 'auth:api', 'auth:sanctum',
    'throttle:api',
]);

