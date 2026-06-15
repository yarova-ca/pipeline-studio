<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        // Routes are mounted at the root (no /api prefix) — they define
        // /health, /auth, /users/me/items themselves.
        api: __DIR__.'/../routes/api.php',
        apiPrefix: '',
        commands: __DIR__.'/../routes/console.php',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // I-13 then I-17 on every request: measure, then harden headers.
        $middleware->append(\App\Http\Middleware\Metrics::class);
        $middleware->append(\App\Http\Middleware\SecurityHeaders::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // I-9: never leak internals; return a typed JSON error.
        $exceptions->shouldRenderJsonWhen(fn () => true);
    })
    ->create();
