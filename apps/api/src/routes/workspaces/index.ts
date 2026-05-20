import type { PrismaClient } from '@prisma/client'
import { createWorkspaceSchema } from '@termless/shared'
import type { FastifyInstance } from 'fastify'
import { requireRole } from '../../plugins/rbac.js'

export async function registerWorkspaceRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/api/v1/workspaces',
    {
      schema: { tags: ['workspaces'], description: 'List workspaces' },
      preHandler: [requireRole('DEVELOPER')],
    },
    async (request) => {
      const prisma = (fastify as any).prisma as PrismaClient
      const userId = (request as any).user.id
      return prisma.workspace.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      })
    },
  )

  fastify.post(
    '/api/v1/workspaces',
    {
      schema: { tags: ['workspaces'], description: 'Create workspace' },
      preHandler: [requireRole('DEVELOPER')],
    },
    async (request, reply) => {
      const body = createWorkspaceSchema.parse(request.body)
      const user = (request as any).user
      const prisma = (fastify as any).prisma as PrismaClient

      const workspace = await prisma.workspace.create({
        data: {
          userId: user.id,
          name: body.name,
          path: body.path,
        },
      })
      ;(fastify as any).audit?.(user.id, 'workspace.create', { name: body.name }, request.ip)
      return reply.code(201).send(workspace)
    },
  )
}
