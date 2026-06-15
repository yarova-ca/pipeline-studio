import { NodeSDK } from '@opentelemetry/sdk-node'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'

// OTel SDK — must be imported FIRST in src/index.ts before all other imports.
// Why first: auto-instrumentations patch modules at require-time.
// Patching after a module loads = no spans for that module.
//
// Skipped in test environment: avoids OTEL connection errors in CI
// and reduces test startup time by ~2s.
//
// Endpoint: OTEL_EXPORTER_OTLP_ENDPOINT env var.
// Default: http://localhost:4318/v1/traces (local collector).
//
// I-14: tracing is off unless OTEL_ENABLED=true, so a missing collector
// never breaks startup or normal runs.
if (process.env.OTEL_ENABLED === 'true') {
  const sdk = new NodeSDK({
    traceExporter: new OTLPTraceExporter({
      url:
        process.env.OTEL_EXPORTER_OTLP_ENDPOINT ??
        'http://localhost:4318/v1/traces',
    }),
    instrumentations: [getNodeAutoInstrumentations()],
  })

  sdk.start()

  // Flush pending spans before the process exits.
  process.on('SIGTERM', () => sdk.shutdown())
}
