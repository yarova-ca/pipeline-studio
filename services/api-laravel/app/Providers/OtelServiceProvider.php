<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Log;
use OpenTelemetry\API\Globals;
use OpenTelemetry\Contrib\Otlp\OtlpHttpTransportFactory;
use OpenTelemetry\Contrib\Otlp\SpanExporter;
use OpenTelemetry\SDK\Common\Attribute\Attributes;
use OpenTelemetry\SDK\Resource\ResourceInfo;
use OpenTelemetry\SDK\Trace\Sampler\AlwaysOnSampler;
use OpenTelemetry\SDK\Trace\SpanProcessor\BatchSpanProcessor;
use OpenTelemetry\SDK\Trace\TracerProvider;
use OpenTelemetry\SemConv\ResourceAttributes;

/**
 * OpenTelemetry service provider.
 * Initialised only when OTEL_ENABLED=true.
 * Set OTEL_EXPORTER_OTLP_ENDPOINT to point at your OTel collector.
 */
class OtelServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        if (env('OTEL_ENABLED') !== 'true') {
            return;
        }

        $resource = ResourceInfo::create(Attributes::create([
            ResourceAttributes::SERVICE_NAME => '23-laravel',
        ]));

        $transport = (new OtlpHttpTransportFactory())->create(
            env('OTEL_EXPORTER_OTLP_ENDPOINT', 'http://localhost:4318/v1/traces'),
            'application/x-protobuf'
        );
        $exporter = new SpanExporter($transport);
        $processor = new BatchSpanProcessor($exporter);

        $tracerProvider = new TracerProvider(
            [$processor],
            new AlwaysOnSampler(),
            $resource
        );

        Globals::registerInitializer(function ($instrumentationLibrary) use ($tracerProvider) {
            return $tracerProvider;
        });

        Log::info('OTel enabled', ['endpoint' => env('OTEL_EXPORTER_OTLP_ENDPOINT', 'default')]);
    }
}
