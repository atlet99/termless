/**
 * Copyright 2026 Abdurakhman Rakhmankulov
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { Role } from '@termless/shared'
import { hasRole } from '@termless/shared'
import type { FastifyReply, FastifyRequest } from 'fastify'
import fp from 'fastify-plugin'

// eslint-disable-next-line unicorn/prefer-export-from -- hasRole is used locally
export { hasRole }

export function requireRole(role: Role) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
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

export function requireAdminIpAllowlist() {
  const ADMIN_IP_ALLOWLIST =
    process.env.ADMIN_IP_ALLOWLIST?.split(',')
      .map((ip) => ip.trim())
      .filter(Boolean) ?? []

  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (ADMIN_IP_ALLOWLIST.length === 0) {
      return
    }

    const forwarded = request.headers['x-forwarded-for']
    let clientIp: string
    if (typeof forwarded === 'string' && forwarded.length > 0) {
      const parts = forwarded.split(',')
      clientIp = parts[0]?.trim() ?? 'unknown'
    } else {
      clientIp = request.ip ?? 'unknown'
    }

    if (!ADMIN_IP_ALLOWLIST.includes(clientIp)) {
      return reply
        .code(403)
        .send({ error: 'Forbidden', message: 'IP not allowed for admin access', statusCode: 403 })
    }
  }
}

export const register = fp(async (fastify) => {
  fastify.decorate('hasRole', hasRole)
  fastify.decorate('requireRole', requireRole)
})
