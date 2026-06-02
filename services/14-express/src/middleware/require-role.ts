// RBAC (Role-Based Access Control): restricts access based on user role.
// Why: "authenticated = full access" violates principle of least privilege.
// Without RBAC, there's no way to grant read-only API keys or admin-only endpoints.

import type { Request, Response, NextFunction } from 'express'
import { auditLog } from './audit.js'

// Roles are defined here and in prisma/schema.prisma
export type Role = 'USER' | 'ADMIN' | 'SERVICE'

export const requireRole =
  (role: Role) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }
    const userRole = (req.user as any).role ?? 'USER'
    if (userRole !== role && userRole !== 'ADMIN') {
      auditLog('access_denied', req.user.id, req, { requiredRole: role, actualRole: userRole })
      res.status(403).json({ error: `Requires role: ${role}` })
      return
    }
    next()
  }
