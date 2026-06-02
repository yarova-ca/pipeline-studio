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

// Normalize span names to route templates — prevents high cardinality.
// Raw: "GET /users/me/items/abc123" → Template: "GET /users/me/items/{id}"
// Why: one time-series per route pattern, not one per unique ID value.
const normalizeSpanName = (name: string): string =>
  name.replace(/\/[0-9a-f-]{8,}/gi, '/{id}').replace(/\/\d+/g, '/{id}')

if (process.env.NODE_ENV !== 'test') {
  const sdk = new NodeSDK({
    traceExporter: new OTLPTraceExporter({
      url:
        process.env.OTEL_EXPORTER_OTLP_ENDPOINT ??
        'http://localhost:4318/v1/traces',
    }),
    instrumentations: [getNodeAutoInstrumentations()],
    spanProcessors: [],
  })

  sdk.start()

  // Flush pending spans before the process exits.
  process.on('SIGTERM', () => sdk.shutdown())
}

export { normalizeSpanName }
