<?php

use App\Http\Controllers\Webhook\SesInboundController;
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

// Webhook para receber e-mails do Amazon SES (SNS ou direto)
Route::post('/webhooks/ses/inbound', [SesInboundController::class, 'store'])
    ->name('api.webhooks.ses.inbound');
