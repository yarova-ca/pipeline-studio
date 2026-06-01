// gRPC auth interceptor — validates JWT or API key from gRPC metadata.
//
// gRPC metadata is the equivalent of HTTP headers.
// Clients send: metadata.set('authorization', 'Bearer <token>')
//               metadata.set('x-api-key', '<key>')
//
// On valid JWT: attaches user to call context, proceeds.
// On valid API key: DB lookup, attaches user, proceeds.
// On missing or invalid credential: sends UNAUTHENTICATED status, halts call.

import {
  ServerInterceptingCall,
  ServerInterceptor,
  status,
} from '@grpc/grpc-js'
import jwt from 'jsonwebtoken'
import { prisma } from '../db/client.js'
import type { AuthUser } from '../middleware/auth.js'

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production'

export function verifyToken(token: string): AuthUser | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthUser
    return { id: payload.id, email: payload.email, name: payload.name }
  } catch {
    return null
  }
}

// authInterceptor is a gRPC server interceptor.
// Register at server creation: new Server({ interceptors: [authInterceptor] })
export const authInterceptor: ServerInterceptor = (methodDescriptor, call) => {
  return new ServerInterceptingCall(call, {
    start(metadata, listener, next) {
      const authValues = metadata.get('authorization')
      const apiKeyValues = metadata.get('x-api-key')

      // --- Attempt 1: Bearer JWT ---
      if (authValues.length > 0) {
        const authHeader = authValues[0] as string
        if (authHeader.startsWith('Bearer ')) {
          const token = authHeader.slice(7)
          const user = verifyToken(token)
          if (user) {
            // Attach user to metadata for downstream handlers.
            metadata.set('x-user-id', user.id)
            metadata.set('x-user-email', user.email)
            metadata.set('x-user-name', user.name)
            next(metadata, listener)
            return
          }
        }
        call.sendStatus({
          code: status.UNAUTHENTICATED,
          details: 'Invalid or expired JWT token',
        })
        return
      }

      // --- Attempt 2: X-API-Key header ---
      if (apiKeyValues.length > 0) {
        const apiKey = apiKeyValues[0] as string
        prisma.user
          .findUnique({ where: { apiKey } })
          .then((user) => {
            if (!user) {
              call.sendStatus({
                code: status.UNAUTHENTICATED,
                details: 'Invalid API key',
              })
              return
            }
            metadata.set('x-user-id', user.id)
            metadata.set('x-user-email', user.email)
            metadata.set('x-user-name', user.name)
            next(metadata, listener)
          })
          .catch(() => {
            call.sendStatus({
              code: status.INTERNAL,
              details: 'Auth check failed',
            })
          })
        return
      }

      // --- No credentials ---
      call.sendStatus({
        code: status.UNAUTHENTICATED,
        details: 'Authentication required. Provide Bearer token or x-api-key metadata.',
      })
    },
  })
}
