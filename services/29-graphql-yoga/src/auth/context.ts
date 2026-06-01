// GraphQL Yoga context factory — builds the per-request GraphQL context.
//
// Resolution order:
//   1. Authorization: Bearer <JWT> header — verified without a DB hit.
//   2. X-API-Key header — DB lookup via Prisma.
//
// When auth succeeds: context.user is populated with AuthUser.
// When auth fails or is missing: context.user is null.
//   Protected resolvers must check context.user and throw GraphQLError with UNAUTHENTICATED.

import type { YogaInitialContext } from 'graphql-yoga'
import { verifyToken } from '../middleware/auth.js'
import { prisma } from '../db/client.js'
import type { AuthUser } from '../middleware/auth.js'

export interface GraphQLContext {
  user: AuthUser | null
  prisma: typeof prisma
}

export async function buildContext(
  initialContext: YogaInitialContext,
): Promise<GraphQLContext> {
  const req = initialContext.request
  const authHeader = req.headers.get('authorization')
  const apiKey = req.headers.get('x-api-key')

  // --- Attempt 1: Bearer JWT ---
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const user = verifyToken(token)
    if (user) {
      return { user, prisma }
    }
  }

  // --- Attempt 2: X-API-Key ---
  if (apiKey) {
    const dbUser = await prisma.user.findUnique({ where: { apiKey } })
    if (dbUser) {
      return {
        user: { id: dbUser.id, email: dbUser.email, name: dbUser.name },
        prisma,
      }
    }
  }

  return { user: null, prisma }
}
