import pino from 'pino'

// Structured JSON logger.
// Development: pretty-printed via pino-pretty.
// Production:  raw JSON for log aggregators (Loki, CloudWatch, etc.).
export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  redact: ["req.headers.authorization", "req.headers[\"x-api-key\"]", "*.password", "*.token", "*.apiKey"],
  transport:
    process.env.NODE_ENV === 'development'
      ? { target: 'pino-pretty' }
      : undefined,
})
