<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Cache\RateLimiter;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

/**
 * Rate limiter middleware — 100 requests per minute per IP.
 * Uses Laravel's built-in RateLimiter backed by the cache driver.
 * Health and docs endpoints are exempt so k8s probes are never blocked.
 */
class RateLimit
{
    public function __construct(private RateLimiter $limiter) {}

    public function handle(Request $request, Closure $next): SymfonyResponse
    {
        // Health and docs endpoints are exempt.
        if (
            str_starts_with($request->path(), 'health') ||
            str_starts_with($request->path(), 'api/documentation') ||
            str_starts_with($request->path(), 'docs')
        ) {
            return $next($request);
        }

        $key = 'rate_limit:' . $request->ip();

        if ($this->limiter->tooManyAttempts($key, 100)) {
            return response()->json(
                ['error' => 'Too many requests — try again in 60 seconds'],
                429
            );
        }

        $this->limiter->hit($key, 60);

        return $next($request);
    }
}
