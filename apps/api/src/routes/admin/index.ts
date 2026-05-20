import type { PrismaClient } from '@prisma/client'
import { updateUserRoleSchema } from '@termless/shared'
import type { FastifyInstance } from 'fastify'
import { requireRole } from '../../plugins/rbac.js'

export async function registerAdminRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/api/v1/admin/users',
    {
      schema: { tags: ['admin'], description: 'List all users (ADMIN only)' },
      preHandler: [requireRole('ADMIN')],
    },
    async () => {
      const prisma = (fastify as any).prisma as PrismaClient
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
      const { email, displayName, role, password } = request.body as any
      const prisma = (fastify as any).prisma as PrismaClient

      const { hashPassword } = await import('@termless/auth')
      const passwordHash = password ? await hashPassword(password) : null

      const user = await prisma.user.create({
        data: { email, displayName, role, passwordHash },
      })
      ;(fastify as any).audit?.(
        (request as any).user.id,
        'admin.user.create',
        { userId: user.id },
        request.ip,
      )
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
      const prisma = (fastify as any).prisma as PrismaClient

      const user = await prisma.user.update({
        where: { id },
        data: { role },
      })
      ;(fastify as any).audit?.(
        (request as any).user.id,
        'admin.user.updateRole',
        { userId: id, role },
        request.ip,
      )
      return { id: user.id, role: user.role }
    },
  )
}
