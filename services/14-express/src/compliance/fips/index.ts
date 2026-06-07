import type { Express } from 'express'
import crypto from 'node:crypto'
export function applyCompliance(_app: Express): void {
  if (typeof (crypto as any).getFips === 'function' && (crypto as any).getFips() !== 1)
    throw new Error('FIPS: OpenSSL FIPS module not active — build with RUNTIME=fips')
}
