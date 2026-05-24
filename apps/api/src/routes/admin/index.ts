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

import { updateUserRoleSchema } from '@termless/shared'
import { z } from 'zod'
import type { FastifyInstance } from 'fastify'
import { requireRole } from '../../plugins/rbac.js'

const createUserSchema = z.object({
  email: z.email(),
  displayName: z.string().max(100).optional(),
  role: z.enum(['ADMIN', 'OPERATOR', 'DEVELOPER', 'VIEWER']),
  password: z.string().min(8).optional(),
})

export async function registerAdminRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/api/v1/admin/users',
    {
      schema: { tags: ['admin'], description: 'List all users (ADMIN only)' },
      preHandler: [requireRole('ADMIN')],
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
      preHandler: [requireRole('ADMIN')],
    },
    async (request, reply) => {
      const { email, displayName, role, password } = createUserSchema.parse(request.body)
      const prisma = fastify.prisma

      const { hashPassword } = await import('@termless/auth')
      const passwordHash = password ? await hashPassword(password) : null

      const user = await prisma.user.create({
        data: { email, displayName: displayName ?? null, role, passwordHash },
      })
      void fastify.audit(request.user!.id, 'admin.user.create', { userId: user.id }, request.ip)
      return reply.code(201).send({ id: user.id, email: user.email, role: user.role })
    },
  )

  fastify.put(
    '/api/v1/admin/users/:id/role',
    {
      schema: { tags: ['admin'], description: 'Update user role (ADMIN only)' },
      preHandler: [requireRole('ADMIN')],
    },
    async (request, _reply) => {
      const { id } = request.params as { id: string }
      const { role } = updateUserRoleSchema.parse(request.body)
      const prisma = fastify.prisma

      const user = await prisma.user.update({
        where: { id },
        data: { role },
      })
      void fastify.audit(
        request.user!.id,
        'admin.user.updateRole',
        { userId: id, role },
        request.ip,
      )
      return { id: user.id, role: user.role }
    },
  )
}
