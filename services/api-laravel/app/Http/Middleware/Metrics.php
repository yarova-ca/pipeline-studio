<?php

namespace App\Http\Middleware;

use App\Support\Metrics as MetricsStore;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

// I-13: measure every request's duration into the Prometheus histogram.
class Metrics
{
    public function handle(Request $request, Closure $next): Response
    {
        $start = microtime(true);
        $response = $next($request);

        // The /metrics scrape itself is not measured, to avoid self-noise.
        if ($request->path() !== 'metrics') {
            MetricsStore::observe(
                $request->method(),
                $response->getStatusCode(),
                microtime(true) - $start,
            );
        }

        return $response;
    }
}
