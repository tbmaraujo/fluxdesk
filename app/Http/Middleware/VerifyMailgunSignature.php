<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class VerifyMailgunSignature
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $signingKey = config('services.mailgun.webhook_signing_key');

        // Se não houver signing key configurada, pular validação (dev)
        if (empty($signingKey)) {
            Log::warning('Mailgun webhook signing key não configurada - pulando validação');
            return $next($request);
        }

        $timestamp = $request->input('timestamp');
        $token = $request->input('token');
        $signature = $request->input('signature');

        if (!$timestamp || !$token || !$signature) {
            Log::warning('Mailgun webhook sem campos de assinatura', [
                'has_timestamp' => !empty($timestamp),
                'has_token' => !empty($token),
                'has_signature' => !empty($signature),
                'ip' => $request->ip(),
            ]);
            return response()->json(['error' => 'Missing signature fields'], 401);
        }

        // Verificar se o timestamp não é muito antigo (prevenir replay attacks)
        // Permitir drift de 5 minutos
        $now = time();
        if (abs($now - $timestamp) > 300) {
            Log::warning('Mailgun webhook com timestamp expirado', [
                'timestamp' => $timestamp,
                'now' => $now,
                'diff' => abs($now - $timestamp),
                'ip' => $request->ip(),
            ]);
            return response()->json(['error' => 'Timestamp expired'], 401);
        }

        // Calcular HMAC SHA256
        $expectedSignature = hash_hmac('sha256', $timestamp . $token, $signingKey);

        // Usar hash_equals para comparação segura
        if (!hash_equals($expectedSignature, $signature)) {
            Log::warning('Mailgun webhook com assinatura inválida', [
                'ip' => $request->ip(),
            ]);
            return response()->json(['error' => 'Invalid signature'], 401);
        }

        return $next($request);
    }
}
