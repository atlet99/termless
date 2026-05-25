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

import { ROLE_NAMES, updateUserRoleSchema } from '@termless/shared'
import { z } from 'zod'
import type { FastifyInstance } from 'fastify'
import { requireAdminIpAllowlist, requireRole } from '../../plugins/rbac.js'

const createUserSchema = z.object({
  email: z.email(),
  displayName: z.string().max(100).optional(),
  role: z.enum(ROLE_NAMES),
  password: z.string().min(8).optional(),
})

export async function registerAdminRoutes(fastify: FastifyInstance) {
  const adminPreHandler = [requireRole('ADMIN'), requireAdminIpAllowlist()]

  fastify.get(
    '/api/v1/admin/users',
    {
      schema: { tags: ['admin'], description: 'List all users (ADMIN only)' },
      preHandler: adminPreHandler,
    },
    async () => {
      const prisma = fastify.prisma
      return prisma.user.findMany({
        select: { id: true, email: true, displayName: true, role: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      })
    },
  )

  fastify.post(
    '/api/v1/admin/users',
    {
      schema: { tags: ['admin'], description: 'Create user (ADMIN only)' },
      preHandler: adminPreHandler,
    },
    async (request, reply) => {
      const { email, displayName, role, password } = createUserSchema.parse(request.body)
      const prisma = fastify.prisma

      const { hashPassword } = await import('@termless/auth')
      const passwordHash = password ? await hashPassword(password) : null

      const user = await prisma.user.create({
        data: { email, displayName: displayName ?? null, role, passwordHash },
      })
      const adminUser = request.user
      if (!adminUser) return reply.code(401).send({ error: 'Unauthorized' })
      void fastify.audit(adminUser.id, 'admin.user.create', { userId: user.id }, request.ip)
      return reply.code(201).send({ id: user.id, email: user.email, role: user.role })
    },
  )

  fastify.put(
    '/api/v1/admin/users/:id/role',
    {
      schema: { tags: ['admin'], description: 'Update user role (ADMIN only)' },
      preHandler: adminPreHandler,
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const { role } = updateUserRoleSchema.parse(request.body)
      const prisma = fastify.prisma
      const adminUser = request.user
      if (!adminUser) return reply.code(401).send({ error: 'Unauthorized' })

      const user = await prisma.user.update({
        where: { id },
        data: { role },
      })
      void fastify.audit(adminUser.id, 'admin.user.updateRole', { userId: id, role }, request.ip)
      return { id: user.id, role: user.role }
    },
  )

  fastify.get(
    '/api/v1/admin/audit-logs',
    {
      schema: { tags: ['admin'], description: 'List audit logs (ADMIN only)' },
      preHandler: adminPreHandler,
    },
    async (request) => {
      const prisma = fastify.prisma
      const query = request.query as Record<string, string | undefined>
      const page = Math.max(1, Number(query.page) || 1)
      const limit = Math.min(100, Math.max(1, Number(query.limit) || 50))
      const offset = (page - 1) * limit

      const where: Record<string, unknown> = {}
      if (query.userId) where.userId = query.userId
      if (query.action) where.action = query.action

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        prisma.auditLog.count({ where }),
      ])

      return {
        data: logs,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      }
    },
  )

  fastify.delete(
    '/api/v1/admin/users/:id/sessions',
    {
      schema: {
        tags: ['admin'],
        description: 'Force-logout user - revoke all sessions (ADMIN only)',
      },
      preHandler: adminPreHandler,
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const prisma = fastify.prisma
      const redisUrl = process.env.REDIS_URL
      const adminUser = request.user
      if (!adminUser) return reply.code(401).send({ error: 'Unauthorized' })

      const user = await prisma.user.findUnique({ where: { id } })
      if (!user) return reply.code(404).send({ error: 'User not found' })

      const sessions = await prisma.session.findMany({ where: { userId: id } })

      for (const session of sessions) {
        if (session.ttydPort) {
          const { stopTtyd } = await import('@termless/worker')
          stopTtyd(session.ttydPort)
        }
      }

      await prisma.session.deleteMany({ where: { userId: id } })

      if (redisUrl) {
        const { getRedisClient } = await import('@termless/auth')
        const client = await getRedisClient(redisUrl)
        const keys = await client.keys('termless:session:*')
        for (const key of keys) {
          const data = await client.get(key)
          if (data) {
            const sessionUser = JSON.parse(data) as { id?: string }
            if (sessionUser.id === id) {
              await client.del(key)
            }
          }
        }
      }

      void fastify.audit(adminUser.id, 'admin.user.force_logout', { userId: id }, request.ip)
      return { ok: true, revokedSessions: sessions.length }
    },
  )
}
