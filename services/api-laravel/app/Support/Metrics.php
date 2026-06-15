<?php

namespace App\Support;

use Prometheus\CollectorRegistry;
use Prometheus\RenderTextFormat;
use Prometheus\Storage\APC;

// I-13: a single Prometheus registry backed by APCu shared memory.
// PHP is shared-nothing per request; APCu is what carries counts across them.
class Metrics
{
    private static ?CollectorRegistry $registry = null;

    public static function registry(): CollectorRegistry
    {
        if (self::$registry === null) {
            self::$registry = new CollectorRegistry(new APC());
        }

        return self::$registry;
    }

    public static function observe(string $method, int $status, float $seconds): void
    {
        $histogram = self::registry()->getOrRegisterHistogram(
            '',
            'http_request_duration_seconds',
            'HTTP request duration in seconds',
            ['method', 'status'],
            [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
        );
        $histogram->observe($seconds, [$method, (string) $status]);
    }

    public static function render(): string
    {
        return (new RenderTextFormat())->render(self::registry()->getMetricFamilySamples());
    }
}
