import pino from 'pino'

// I-12: structured JSON logs to stdout, with secret keys redacted.
export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  redact: ['req.headers.authorization', 'JWT_SECRET', '*.apiKey', '*.api_key'],
})
