<?php

use Illuminate\Foundation\Application;
use App\Http\Middleware\IdentifyTenant;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
	api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Trust all proxies (Cloudflare, Nginx)
        $middleware->trustProxies(at: '*');

        // Exceções CSRF para webhooks
        $middleware->validateCsrfTokens(except: [
            '/api/webhooks/ses-inbound',
        ]);

        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);

        // Registrar o middleware de identificação de tenant
        // Será aplicado apenas em rotas que requerem autenticação
        $middleware->alias([
            'identify.tenant' => \App\Http\Middleware\IdentifyTenant::class,
            'prevent.superadmin' => \App\Http\Middleware\PreventSuperAdminAccess::class,
            'superadmin' => \App\Http\Middleware\SuperAdminMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
