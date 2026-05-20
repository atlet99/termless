import type { Role } from '@termless/shared'
import fp from 'fastify-plugin'

const ROLE_HIERARCHY: Record<Role, number> = {
  VIEWER: 0,
  DEVELOPER: 1,
  OPERATOR: 2,
  ADMIN: 3,
}

export function hasRole(userRole: Role | undefined, requiredRole: Role): boolean {
  if (!userRole) return false
  return (ROLE_HIERARCHY[userRole] ?? 0) >= (ROLE_HIERARCHY[requiredRole] ?? 0)
}

export function requireRole(role: Role) {
  return async (request: any, reply: any) => {
    if (!request.user) {
      return reply
        .code(401)
        .send({ error: 'Unauthorized', message: 'Authentication required', statusCode: 401 })
    }
    if (!hasRole(request.user.role, role)) {
      return reply
        .code(403)
        .send({ error: 'Forbidden', message: 'Insufficient permissions', statusCode: 403 })
    }
  }
}

export const register = fp(async (fastify) => {
  fastify.decorate('hasRole', hasRole)
  fastify.decorate('requireRole', requireRole)
})
